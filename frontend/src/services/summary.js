import API from "./api";

export const getSummary = (text) =>
    API.post("/summary/generate", { text });
