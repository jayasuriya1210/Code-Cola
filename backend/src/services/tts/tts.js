const googleTTS = require("google-tts-api");

function generateTTS(text, lang) {
    const clean = (text || "").replace(/\s+/g, " ").trim();
    if (!clean) {
        throw new Error("No text available to generate audio.");
    }

    const language = (lang || "en").toLowerCase();
    const chunks = googleTTS.getAllAudioUrls(clean, {
        lang: language,
        slow: false,
        host: "https://translate.google.com",
    });

    const audioURLs = chunks.map((c) => c.url).filter(Boolean);
    if (!audioURLs.length) {
        throw new Error("Audio generation failed for this text.");
    }

    return {
        audioURL: audioURLs[0],
        audioURLs,
    };
}

module.exports = { generateTTS };
