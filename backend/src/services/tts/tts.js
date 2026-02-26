const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const googleTTS = require("google-tts-api");
const { EdgeTTS } = require("node-edge-tts");

const AUDIO_DIR = path.resolve(__dirname, "../../../audio");
const PROJECT_ROOT = path.resolve(__dirname, "../../../../");
const EDGE_VOICE = process.env.TTS_EDGE_VOICE || "en-US-AriaNeural";
const EDGE_RATE = process.env.TTS_EDGE_RATE || "+20%";
const EDGE_PITCH = process.env.TTS_EDGE_PITCH || "default";
const TTS_MAX_CHARS_PER_CHUNK = Number(process.env.TTS_MAX_CHARS_PER_CHUNK || 1100);
const TTS_MAX_CHARS_PER_CHUNK_PIPER = Number(process.env.TTS_MAX_CHARS_PER_CHUNK_PIPER || 900);

const PIPER_ENABLED = process.env.PIPER_ENABLED === "true";
const PIPER_PATH = process.env.PIPER_PATH || "piper";
const PIPER_MODEL_PATH = process.env.PIPER_MODEL_PATH || "";
const PIPER_CONFIG_PATH = process.env.PIPER_CONFIG_PATH || "";

// Keep Google as opt-in fallback only. It can be unstable and often causes 0:00 playback.
const TTS_USE_GOOGLE_FALLBACK = process.env.TTS_USE_GOOGLE_FALLBACK !== "false";

function resolveEnvPath(envValue, fallbackAbsolutePath) {
  if (!envValue) return fallbackAbsolutePath;
  return path.isAbsolute(envValue) ? envValue : path.resolve(process.cwd(), envValue);
}

const INDICF5_ENABLED = process.env.INDICF5_ENABLED !== "false";
const INDICF5_PYTHON = process.env.INDICF5_PYTHON || "python";
const INDICF5_MODEL_ID = process.env.INDICF5_MODEL_ID || "ai4bharat/IndicF5";
const INDICF5_REPO_DIR = resolveEnvPath(
  process.env.INDICF5_REPO_DIR,
  path.resolve(PROJECT_ROOT, "IndicF5")
);
const INDICF5_SCRIPT_PATH = resolveEnvPath(
  process.env.INDICF5_SCRIPT_PATH,
  path.resolve(__dirname, "indicf5_infer.py")
);
const INDICF5_REF_AUDIO_PATH = resolveEnvPath(
  process.env.INDICF5_REF_AUDIO_PATH,
  path.resolve(INDICF5_REPO_DIR, "prompts/PAN_F_HAPPY_00001.wav")
);
const INDICF5_REF_TEXT =
  process.env.INDICF5_REF_TEXT ||
  "ਭਹੰਪੀ ਵਿੱਚ ਸਮਾਰਕਾਂ ਦੇ ਭਵਨ ਨਿਰਮਾਣ ਕਲਾ ਦੇ ਵੇਰਵੇ ਗੁੰਝਲਦਾਰ ਅਤੇ ਹੈਰਾਨ ਕਰਨ ਵਾਲੇ ਹਨ, ਜੋ ਮੈਨੂੰ ਖੁਸ਼ ਕਰਦੇ ਹਨ।";
const INDICF5_HF_TOKEN = process.env.INDICF5_HF_TOKEN || process.env.HF_TOKEN || "";
const INDICF5_FFMPEG_BIN = resolveEnvPath(process.env.INDICF5_FFMPEG_BIN, "");
const INDICF5_DEVICE = process.env.INDICF5_DEVICE || "auto";
const INDICF5_SAMPLE_RATE = Number(process.env.INDICF5_SAMPLE_RATE || 24000);

function normalizeText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/[*_`#>-]/g, " ")
    .trim();
}

function shortenForGoogle(text, maxChars = 340) {
  if (text.length <= maxChars) return text;
  const short = text.slice(0, maxChars);
  const end = Math.max(short.lastIndexOf("."), short.lastIndexOf("?"), short.lastIndexOf("!"));
  if (end > 120) return short.slice(0, end + 1);
  return short;
}

function splitIntoChunks(text, maxChars = 1000) {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!parts.length) return [];

  const out = [];
  let buf = "";
  for (const sentence of parts) {
    if (sentence.length > maxChars) {
      const words = sentence.split(/\s+/).filter(Boolean);
      let wordBuf = "";
      for (const word of words) {
        if (!wordBuf) {
          wordBuf = word;
          continue;
        }
        if ((wordBuf.length + word.length + 1) <= maxChars) {
          wordBuf += ` ${word}`;
        } else {
          out.push(wordBuf);
          wordBuf = word;
        }
      }
      if (wordBuf) out.push(wordBuf);
      continue;
    }
    if (!buf) {
      buf = sentence;
      continue;
    }
    if ((buf.length + sentence.length + 1) <= maxChars) {
      buf += ` ${sentence}`;
    } else {
      out.push(buf);
      buf = sentence;
    }
  }
  if (buf) out.push(buf);
  return out;
}

function mergeWavFiles(wavBuffers) {
  if (!wavBuffers.length) throw new Error("Audio generation failed.");
  if (wavBuffers.length === 1) return wavBuffers[0];

  const header = Buffer.from(wavBuffers[0].subarray(0, 44));
  const pcmParts = wavBuffers.map((buf) => buf.subarray(44));
  const totalDataSize = pcmParts.reduce((sum, part) => sum + part.length, 0);
  header.writeUInt32LE(36 + totalDataSize, 4);
  header.writeUInt32LE(totalDataSize, 40);
  return Buffer.concat([header, ...pcmParts]);
}

async function runIndicF5(text, outputFile) {
  const args = [
    INDICF5_SCRIPT_PATH,
    "--text",
    text,
    "--output",
    outputFile,
    "--model-id",
    INDICF5_MODEL_ID,
    "--ref-audio",
    INDICF5_REF_AUDIO_PATH,
    "--ref-text",
    INDICF5_REF_TEXT,
    "--sample-rate",
    String(INDICF5_SAMPLE_RATE),
  ];
  if (INDICF5_HF_TOKEN) args.push("--hf-token", INDICF5_HF_TOKEN);
  if (INDICF5_DEVICE && INDICF5_DEVICE !== "auto") {
    args.push("--device", INDICF5_DEVICE);
  }

  await new Promise((resolve, reject) => {
    const existingPythonPath = process.env.PYTHONPATH ? `${process.env.PYTHONPATH}${path.delimiter}` : "";
    const existingPath = process.env.PATH || "";
    const ffmpegPathPart = INDICF5_FFMPEG_BIN && fs.existsSync(INDICF5_FFMPEG_BIN)
      ? `${INDICF5_FFMPEG_BIN}${path.delimiter}`
      : "";
    const child = spawn(INDICF5_PYTHON, args, {
      cwd: INDICF5_REPO_DIR,
      env: {
        ...process.env,
        PATH: `${ffmpegPathPart}${existingPath}`,
        PYTHONPATH: `${existingPythonPath}${INDICF5_REPO_DIR}`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    child.stderr.on("data", (buf) => {
      stderr += String(buf || "");
    });
    child.on("error", (error) => reject(new Error(`Failed to start IndicF5: ${error.message}`)));
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`IndicF5 exited with code ${code}: ${stderr.trim()}`));
      resolve();
    });
  });
}

async function runIndicF5HealthCheck() {
  await new Promise((resolve, reject) => {
    const args = [INDICF5_SCRIPT_PATH, "--healthcheck", "--verify-model", "--model-id", INDICF5_MODEL_ID];
    if (INDICF5_HF_TOKEN) args.push("--hf-token", INDICF5_HF_TOKEN);

    const existingPythonPath = process.env.PYTHONPATH ? `${process.env.PYTHONPATH}${path.delimiter}` : "";
    const existingPath = process.env.PATH || "";
    const ffmpegPathPart = INDICF5_FFMPEG_BIN && fs.existsSync(INDICF5_FFMPEG_BIN)
      ? `${INDICF5_FFMPEG_BIN}${path.delimiter}`
      : "";
    const child = spawn(INDICF5_PYTHON, args, {
      cwd: INDICF5_REPO_DIR,
      env: {
        ...process.env,
        PATH: `${ffmpegPathPart}${existingPath}`,
        PYTHONPATH: `${existingPythonPath}${INDICF5_REPO_DIR}`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    child.stderr.on("data", (buf) => {
      stderr += String(buf || "");
    });
    child.on("error", (error) => reject(new Error(`Failed to start IndicF5 healthcheck: ${error.message}`)));
    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`IndicF5 healthcheck exited with code ${code}: ${stderr.trim()}`));
      }
      resolve();
    });
  });
}

async function getTTSHealth() {
  const health = {
    timestamp: new Date().toISOString(),
    indicf5: {
      enabled: INDICF5_ENABLED,
      ready: false,
      checks: {
        repoDirExists: fs.existsSync(INDICF5_REPO_DIR),
        scriptExists: fs.existsSync(INDICF5_SCRIPT_PATH),
        refAudioExists: fs.existsSync(INDICF5_REF_AUDIO_PATH),
      },
      error: "",
    },
    piper: {
      enabled: PIPER_ENABLED,
      ready: false,
      checks: {
        modelExists: !PIPER_ENABLED || (Boolean(PIPER_MODEL_PATH) && fs.existsSync(PIPER_MODEL_PATH)),
      },
      error: "",
    },
    edge: {
      enabled: true,
      ready: true,
      error: "",
    },
    googleFallbackEnabled: TTS_USE_GOOGLE_FALLBACK,
  };

  if (INDICF5_ENABLED) {
    const staticOk = health.indicf5.checks.repoDirExists
      && health.indicf5.checks.scriptExists
      && health.indicf5.checks.refAudioExists;
    if (!staticOk) {
      health.indicf5.error = "IndicF5 path checks failed";
    } else {
      try {
        await runIndicF5HealthCheck();
        health.indicf5.ready = true;
      } catch (error) {
        health.indicf5.error = error.message || "IndicF5 healthcheck failed";
      }
    }
  } else {
    health.indicf5.error = "IndicF5 disabled";
  }

  if (PIPER_ENABLED) {
    if (health.piper.checks.modelExists) {
      health.piper.ready = true;
    } else {
      health.piper.error = "Piper model path is invalid";
    }
  } else {
    health.piper.error = "Piper disabled";
  }

  return health;
}

async function generateWithIndicF5(text) {
  if (!INDICF5_ENABLED) throw new Error("IndicF5 disabled");
  if (!fs.existsSync(INDICF5_SCRIPT_PATH)) throw new Error(`IndicF5 script not found: ${INDICF5_SCRIPT_PATH}`);
  if (!fs.existsSync(INDICF5_REPO_DIR)) throw new Error(`IndicF5 repo not found: ${INDICF5_REPO_DIR}`);
  if (!fs.existsSync(INDICF5_REF_AUDIO_PATH)) throw new Error(`IndicF5 reference audio not found: ${INDICF5_REF_AUDIO_PATH}`);

  await fs.promises.mkdir(AUDIO_DIR, { recursive: true });
  const fileName = `tts_${Date.now()}_1.wav`;
  const absolutePath = path.join(AUDIO_DIR, fileName);

  await runIndicF5(text, absolutePath);

  return {
    audioURL: `/audio/${fileName}`,
    audioURLs: [`/audio/${fileName}`],
    provider: "indicf5",
  };
}

async function runPiperChunk(chunkText, outputFile) {
  const args = ["--model", PIPER_MODEL_PATH, "--output_file", outputFile];
  if (PIPER_CONFIG_PATH) args.push("--config", PIPER_CONFIG_PATH);

  await new Promise((resolve, reject) => {
    const child = spawn(PIPER_PATH, args, { stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (buf) => {
      stderr += String(buf || "");
    });
    child.on("error", (error) => reject(new Error(`Failed to start Piper: ${error.message}`)));
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`Piper exited with code ${code}: ${stderr.trim()}`));
      resolve();
    });

    child.stdin.write(chunkText);
    child.stdin.end();
  });
}

async function generateWithPiper(text) {
  if (!PIPER_ENABLED) throw new Error("Piper disabled");
  if (!PIPER_MODEL_PATH) throw new Error("Piper model path is missing");
  if (!fs.existsSync(PIPER_MODEL_PATH)) throw new Error(`Piper model not found: ${PIPER_MODEL_PATH}`);

  await fs.promises.mkdir(AUDIO_DIR, { recursive: true });
  const chunks = splitIntoChunks(text, TTS_MAX_CHARS_PER_CHUNK_PIPER);
  if (!chunks.length) throw new Error("No text for Piper generation");

  const baseStamp = Date.now();
  const audioURLs = [];
  const createdFiles = [];

  try {
    for (let i = 0; i < chunks.length; i += 1) {
      const fileName = `tts_${baseStamp}_${i + 1}.wav`;
      const absolutePath = path.join(AUDIO_DIR, fileName);
      await runPiperChunk(chunks[i], absolutePath);
      audioURLs.push(`/audio/${fileName}`);
      createdFiles.push(absolutePath);
    }
  } catch (error) {
    await Promise.all(createdFiles.map((file) => fs.promises.unlink(file).catch(() => {})));
    throw error;
  }

  return {
    audioURL: audioURLs[0],
    audioURLs,
    provider: "piper",
  };
}

async function generateWithEdge(text) {
  await fs.promises.mkdir(AUDIO_DIR, { recursive: true });
  const chunks = splitIntoChunks(text, TTS_MAX_CHARS_PER_CHUNK);
  if (!chunks.length) throw new Error("No text for Edge generation");

  const tts = new EdgeTTS({
    voice: EDGE_VOICE,
    lang: "en-US",
    outputFormat: "riff-24khz-16bit-mono-pcm",
    timeout: 10000,
    rate: EDGE_RATE,
    pitch: EDGE_PITCH,
    volume: "default",
  });

  const baseStamp = Date.now();
  const audioURLs = [];
  const createdFiles = [];

  try {
    for (let i = 0; i < chunks.length; i += 1) {
      const fileName = `tts_${baseStamp}_${i + 1}.wav`;
      const absolutePath = path.join(AUDIO_DIR, fileName);
      await tts.ttsPromise(chunks[i], absolutePath);
      audioURLs.push(`/audio/${fileName}`);
      createdFiles.push(absolutePath);
    }
  } catch (error) {
    await Promise.all(createdFiles.map((file) => fs.promises.unlink(file).catch(() => {})));
    throw error;
  }

  return {
    audioURL: audioURLs[0],
    audioURLs,
    provider: "edge-tts",
  };
}

function generateWithGoogle(text, lang) {
  const googleText = shortenForGoogle(text);
  const rawUrls = googleTTS.getAllAudioUrls(googleText, {
    lang: String(lang || "en").slice(0, 2).toLowerCase(),
    slow: false,
    host: "https://translate.google.com",
    splitPunct: ",.?!;:",
  })
    .map((row) => row.url)
    .filter(Boolean);

  if (!rawUrls.length) throw new Error("Google TTS URL generation failed");

  const audioURLs = rawUrls.map((url) => `/api/tts/proxy?u=${encodeURIComponent(url)}`);

  return {
    audioURL: audioURLs[0],
    audioURLs,
    provider: "google-tts",
  };
}

async function generateTTS(text, lang) {
  const clean = normalizeText(text);
  if (!clean) throw new Error("No text available to generate audio.");

  try {
    return await generateWithIndicF5(clean);
  } catch (_indicError) {
    // IndicF5 optional; fallback below.
  }

  try {
    return await generateWithPiper(clean);
  } catch (_error) {
    // Piper optional; fallback below
  }

  try {
    return await generateWithEdge(clean);
  } catch (_edgeError) {
    if (!TTS_USE_GOOGLE_FALLBACK) {
      throw new Error("Edge TTS failed and Google fallback is disabled.");
    }
    return generateWithGoogle(clean, lang);
  }
}

module.exports = { generateTTS, getTTSHealth };
