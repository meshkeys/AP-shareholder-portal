/**
 * Shareholder Data API
 *
 * Currently using MOCK mode for development and testing.
 * When you're ready for production:
 *   1. Fill in your backend base URL in .env
 *   2. Uncomment the real API calls below and remove the mock functions
 */

// ─── MOCK (for development) ──────────────────────────────────────────────────

const mockProfile = {
  id: "sh_001",
  firstName: "Adaeze",
  lastName: "Okonkwo",
  email: "",
  phone: "+234 803 456 7890",
  cscsNumber: "CHN-20190045872",
  address: "14 Bourdillon Road, Ikoyi, Lagos",
  state: "Lagos",
  country: "Nigeria",
  nextOfKin: "Emeka Okonkwo",
  tin: "1234567890",
  bankAccount: "0123456789",
  bankName: "Access Bank",
};

export async function checkEmailExists(email) {
  await delay(800);
  const registeredEmails = [
    "adaeze@example.com",
    "test@test.com",
    "meshkeys@gmail.com",
    "nawokgotau@gmail.com",
  ];
  return { exists: registeredEmails.includes(email) };
}

export async function fetchShareholderByEmail(email) {
  await delay(1000);
  return { ...mockProfile, email };
}

export async function submitUpdateRequest(shareholderId, formData) {
  await delay(1500);
  return { referenceNumber: "SRP-" + Date.now().toString().slice(-8) };
}

export async function confirmDetailsCorrect(shareholderId) {
  await delay(1000);
  return { referenceNumber: "SRC-" + Date.now().toString().slice(-8) };
}

// ─── REAL (uncomment when ready for production) ───────────────────────────────

// import axios from 'axios'
//
// const client = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL,
//   headers: { 'Content-Type': 'application/json' },
// })
//
// export async function checkEmailExists(email) {
//   const { data } = await client.get('/shareholders/check-email', { params: { email } })
//   return data
// }
//
// export async function fetchShareholderByEmail(email) {
//   const { data } = await client.get('/shareholders/lookup', { params: { email } })
//   return data
// }
//
// export async function submitUpdateRequest(shareholderId, formData) {
//   const { data } = await client.post(
//     `/shareholders/${shareholderId}/update-request`,
//     formData,
//     { headers: { 'Content-Type': 'multipart/form-data' } }
//   )
//   return data
// }
//
// export async function confirmDetailsCorrect(shareholderId) {
//   const { data } = await client.post(`/shareholders/${shareholderId}/confirm`)
//   return data
// }

// ─── Helper ───────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
