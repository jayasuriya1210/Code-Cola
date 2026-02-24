import API from "./api";

export const uploadPDF = (formData) =>
    API.post("/pdf/upload", formData);
