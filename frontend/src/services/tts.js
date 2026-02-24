import API from "./api";

export const getAudio = (text, lang) =>
    API.post("/tts/generate", { text, lang });
