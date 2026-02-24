import API from "./api";

export const searchCase = (query) =>
    API.post("/scrape/search", { query });
