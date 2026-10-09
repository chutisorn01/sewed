import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { apiRouter } from "./apiRouter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// API endpoints
app.use("/api", apiRouter);

// Serve static frontend when running in production
const candidateDist1 = path.join(__dirname, "../frontend/dist");
const candidateDist2 = path.join(__dirname, "../dist");
const distPath = fs.existsSync(candidateDist1) ? candidateDist1 : candidateDist2;
app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  const indexPath = path.join(distPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send("SSKRU Software Engineering Backend API Server is running. Port: " + PORT);
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SSKRU API Backend running at http://localhost:${PORT}`);
  console.log(`📁 Database: backend/db.json`);
});
