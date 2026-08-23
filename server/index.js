const express = require("express");
const cors = require("cors");
require("dotenv").config();

const otpRoutes = require("./routes/otp");
const authRoutes = require("./routes/auth");
const requestRoutes = require("./routes/requests");
const agentRoutes = require("./routes/agents");
const escalationRoutes = require("./routes/escalations");
const uploadRoutes = require("./routes/uploads");
const { startEscalationScheduler } = require("./utils/escalation");
const autoAssignRoutes = require("./routes/autoAssign");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
/*app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://ap-shareholders-portal.vercel.app/",
    ],
  }),
);
*/
// Handle preflight OPTIONS requests
//app.options("*", cors());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-webhook-secret"],
    credentials: false,
  }),
);

app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/otp", otpRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/escalations", escalationRoutes);
app.use("/api/auto-assign", autoAssignRoutes);
app.use("/api/uploads", uploadRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "ShareReg API is running." });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

// ── Start escalation scheduler ────────────────────────────────────────────────
startEscalationScheduler();
startAutoAssignScheduler();
// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`ShareReg API running on http://localhost:${PORT}`);
});
