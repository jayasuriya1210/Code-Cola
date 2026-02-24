// Import packages
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Initialize express
const app = express();

// Middleware
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
require("./src/config/db");

["uploads/pdf", "audio", "notes/pdf"].forEach((dir) => {
    fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
});

// Static folders (to serve PDF, audio, notes)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/audio", express.static(path.join(__dirname, "audio")));
app.use("/notes", express.static(path.join(__dirname, "notes")));

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/pdf", require("./src/routes/pdfRoutes"));
app.use("/api/scrape", require("./src/routes/scrapeRoutes"));
app.use("/api/tts", require("./src/routes/ttsRoutes"));
app.use("/api/history", require("./src/routes/historyRoutes"));
app.use("/api/summary", require("./src/routes/summaryRoutes"));
app.use("/api/notes", require("./src/routes/notesRoutes"));
app.use("/api/cases", require("./src/routes/caseRoutes"));

// Default route
app.get("/", (req, res) => {
    res.json({ message: "CaseLaw Audio Intelligence Platform API Running" });
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
