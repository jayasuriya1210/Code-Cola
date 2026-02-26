import argparse
import sys

import numpy as np
import soundfile as sf
from transformers import AutoModel


def parse_args():
    parser = argparse.ArgumentParser(description="IndicF5 inference bridge")
    parser.add_argument("--healthcheck", action="store_true")
    parser.add_argument("--verify-model", action="store_true")
    parser.add_argument("--text")
    parser.add_argument("--output")
    parser.add_argument("--model-id", default="ai4bharat/IndicF5")
    parser.add_argument("--ref-audio")
    parser.add_argument("--ref-text")
    parser.add_argument("--hf-token", default="")
    parser.add_argument("--device", default="auto")
    parser.add_argument("--sample-rate", type=int, default=24000)
    return parser.parse_args()


def to_float32_audio(audio):
    arr = np.asarray(audio)
    if arr.dtype == np.int16:
        arr = arr.astype(np.float32) / 32768.0
    elif arr.dtype != np.float32:
        arr = arr.astype(np.float32)

    if arr.ndim > 1:
        arr = np.squeeze(arr)
    return arr


def main():
    args = parse_args()
    if args.healthcheck:
        if args.verify_model:
            kwargs = {"trust_remote_code": True}
            if str(args.hf_token).strip():
                kwargs["token"] = args.hf_token.strip()
            AutoModel.from_pretrained(args.model_id, **kwargs)
        print("ok")
        return

    if not args.text:
        raise ValueError("text is required")
    if not args.output:
        raise ValueError("output is required")
    if not args.ref_audio:
        raise ValueError("ref-audio is required")

    if not str(args.ref_text).strip():
        raise ValueError("ref-text is required and cannot be empty")

    kwargs = {"trust_remote_code": True}
    if str(args.hf_token).strip():
        kwargs["token"] = args.hf_token.strip()
    model = AutoModel.from_pretrained(args.model_id, **kwargs)
    if args.device and args.device != "auto" and hasattr(model, "to"):
        model = model.to(args.device)

    audio = model(
        args.text,
        ref_audio_path=args.ref_audio,
        ref_text=args.ref_text,
    )

    out = to_float32_audio(audio)
    sf.write(args.output, out, samplerate=args.sample_rate)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"IndicF5 inference failed: {exc}", file=sys.stderr)
        raise
