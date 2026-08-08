const express = require("express");
const cors = require("cors");
require("dotenv").config();

const otpRoutes = require("./routes/otp");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "ShareReg API is running." });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/otp", otpRoutes);

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`ShareReg API running on http://localhost:${PORT}`);
});
