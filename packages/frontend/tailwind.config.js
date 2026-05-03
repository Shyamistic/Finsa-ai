/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Dynamic color classes used in AgentDashboard
    { pattern: /bg-(blue|violet|red|amber|teal|green|indigo)-500\/20/ },
    { pattern: /text-(blue|violet|red|amber|teal|green|indigo)-400/ },
    { pattern: /border-(blue|violet|red|amber|teal|green|indigo)-500\/20/ },
    { pattern: /shadow-(blue|violet|red|amber|teal|green|indigo)-500\/20/ },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
};
