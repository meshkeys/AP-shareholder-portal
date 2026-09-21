import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    historyApiFallback: true,
  },
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(
      "https://ap-shareholder-portal.onrender.com",
    ),
    "import.meta.env.VITE_USE_MOCK_OTP": JSON.stringify("false"),
  },
});
