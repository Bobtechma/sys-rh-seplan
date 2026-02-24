/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                "primary": "#0d7ff2",
                "primary-content": "#ffffff",
                "background-light": "#f5f7f8",
                "background-dark": "#101922",
                "surface-light": "#ffffff",
                "surface-dark": "#1e2936",
                "border-light": "#e7edf4",
                "border-dark": "#2d3b4e",
            },
            fontFamily: {
                "display": ["Public Sans", "Noto Sans", "sans-serif"],
                "body": ["Public Sans", "Noto Sans", "sans-serif"]
            }
        },
    },
    plugins: [],
}
