import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#121212",
        canvas: "#f6f1e8",
        accent: "#ffbc0d",
        ember: "#d94c25",
        forest: "#184f38"
      },
      boxShadow: {
        kiosk: "0 32px 80px rgba(18, 18, 18, 0.18)",
        panel: "0 12px 40px rgba(18, 18, 18, 0.14)"
      },
      fontFamily: {
        display: ["Pretendard Variable", "Pretendard", "system-ui", "sans-serif"],
        body: ["Pretendard Variable", "Pretendard", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        "hero-glow": "radial-gradient(circle at top, rgba(255, 188, 13, 0.32), transparent 36%), linear-gradient(135deg, #fff8ec 0%, #f6f1e8 52%, #efe2cb 100%)"
      }
    }
  },
  plugins: []
};

export default config;
