
import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import loanRoutes from "./routes/loans";
import summaryRoutes from "./routes/summary";
import { errorHandler } from "./utils/errors";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*"
}));
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "MiniLedger API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/summary", summaryRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;
