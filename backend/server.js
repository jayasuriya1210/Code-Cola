// Import packages
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { getTTSHealth } = require("./src/services/tts/tts");

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
app.use("/api/workflow", require("./src/routes/workflowRoutes"));

// Default route
app.get("/", (req, res) => {
    res.json({ message: "CaseLaw Audio Intelligence Platform API Running" });
});

// Start Server
const PORT = 5000;
app.listen(PORT, async () => {
    console.log(`Server running on port: ${PORT}`);
    try {
        const health = await getTTSHealth();
        const indic = health.indicf5;
        const piper = health.piper;
        console.log(
            `[TTS] IndicF5 enabled=${indic.enabled} ready=${indic.ready}; Piper enabled=${piper.enabled} ready=${piper.ready}; Edge ready=${health.edge.ready}`
        );
        if (indic.error) console.log(`[TTS] IndicF5: ${indic.error}`);
        if (piper.error) console.log(`[TTS] Piper: ${piper.error}`);
    } catch (error) {
        console.log(`[TTS] health check failed: ${error.message}`);
    }
});
