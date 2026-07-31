/**
 * Termii OTP Service
 *
 * Currently using MOCK mode for development and testing.
 * When you're ready for production:
 *   1. Get your API key from https://termii.com
 *   2. Fill in your .env file
 *   3. Uncomment the real API calls below and remove the mock functions
 */

// ─── MOCK (for development) ──────────────────────────────────────────────────

let mockOTP = "";

export async function sendOTP(email) {
  // Simulate network delay
  await delay(1000);

  // Generate a random 6-digit OTP
  mockOTP = Math.floor(100000 + Math.random() * 900000).toString();

  // Log it to the console so you can test with it
  console.log(`📧 OTP sent to ${email}: ${mockOTP}`);

  // Return a fake pinId
  return { pinId: "mock-pin-id-123" };
}

export async function verifyOTP(pinId, otp) {
  // Simulate network delay
  await delay(800);

  if (otp !== mockOTP) {
    throw new Error("Incorrect code. Please try again.");
  }

  return true;
}

// ─── REAL (uncomment when ready for production) ───────────────────────────────

// import axios from 'axios'
//
// const BASE_URL   = import.meta.env.VITE_TERMII_BASE_URL
// const API_KEY    = import.meta.env.VITE_TERMII_API_KEY
// const SENDER_ID  = import.meta.env.VITE_TERMII_SENDER_ID
//
// export async function sendOTP(email) {
//   const { data } = await axios.post(`${BASE_URL}/sms/otp/send`, {
//     api_key:          API_KEY,
//     message_type:     'NUMERIC',
//     to:               email,
//     from:             SENDER_ID,
//     channel:          'email',
//     pin_attempts:     3,
//     pin_time_to_live: 10,
//     pin_length:       6,
//     pin_placeholder:  '< 1234 >',
//     message_text:     'Your ShareReg verification code is < 1234 >. It expires in 10 minutes.',
//     pin_type:         'NUMERIC',
//   })
//   if (!data.pinId) throw new Error(data.message || 'Failed to send OTP.')
//   return { pinId: data.pinId }
// }
//
// export async function verifyOTP(pinId, otp) {
//   const { data } = await axios.post(`${BASE_URL}/sms/otp/verify`, {
//     api_key: API_KEY,
//     pin_id:  pinId,
//     pin:     otp,
//   })
//   if (data.verified !== true && data.verified !== 'True') {
//     throw new Error(data.msg || 'Incorrect code. Please try again.')
//   }
//   return true
// }

// ─── Helper ───────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
