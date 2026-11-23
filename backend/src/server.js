import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import routes from "./routes/index.js";
import { ensureCommonSubjects } from "./utils/commonSubjects.js";
import { Attendance } from "./models/Academic.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  "/api/auth",
  rateLimit({
    skip: () => process.env.NODE_ENV !== "production",
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", routes);
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.code === "LIMIT_FILE_SIZE")
    return res.status(400).json({ message: "File size must be 10 MB or smaller" });
  if (err instanceof Error && /profile photos|JPG|PNG|WebP/i.test(err.message))
    return res.status(400).json({ message: err.message });
  if (err instanceof Error && /PDF|DOC|DOCX|files? are allowed/i.test(err.message))
    return res.status(400).json({ message: err.message });
  if (err.code === 11000)
    return res
      .status(409)
      .json({ message: "A record with this unique value already exists" });
  res.status(500).json({ message: "Internal server error" });
});
const port = process.env.PORT || 5000;
connectDB()
  .then(async () => {
    await ensureCommonSubjects();
    await Attendance.syncIndexes();
    app.listen(port, () => console.log(`LMS API listening on ${port}`));
  })
  .catch((err) => {
    console.error("Database connection failed", err);
    process.exit(1);
  });
