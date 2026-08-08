/**
 * OTP Service
 *
 * Calls our own backend (server/index.js) which sends OTP via SMTP.
 *
 * For development/testing without SMTP credentials,
 * set VITE_USE_MOCK_OTP=true in your frontend .env file
 * to fall back to the console mock.
 */

const USE_MOCK = false; //import.meta.env.VITE_USE_MOCK_OTP === 'true'
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let mockOTP = "";

// ── Send OTP ──────────────────────────────────────────────────────────────────
export async function sendOTP(email) {
  if (USE_MOCK) {
    await delay(1000);
    mockOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`📧 Mock OTP for ${email}: ${mockOTP}`);
    return { pinId: "mock" };
  }

  const res = await fetch(`${API_URL}/api/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to send OTP. Please try again.");
  }

  return { pinId: "sent" };
}

// ── Verify OTP ────────────────────────────────────────────────────────────────
export async function verifyOTP(pinId, otp, email) {
  if (USE_MOCK) {
    await delay(800);
    if (otp !== mockOTP) {
      throw new Error("Incorrect code. Please try again.");
    }
    return true;
  }

  const res = await fetch(`${API_URL}/api/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Verification failed. Please try again.");
  }

  return true;
}

// ── Helper ────────────────────────────────────────────────────────────────────
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
