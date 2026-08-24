/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stock: {
          up: '#ef4444',      // 한국 증시 상승: 빨간색
          'up-bg': '#fef2f2',
          down: '#3b82f6',    // 한국 증시 하락: 파란색
          'down-bg': '#eff6ff',
          even: '#6b7280',    // 보합: 회색
        }
      }
    },
  },
  plugins: [],
}
