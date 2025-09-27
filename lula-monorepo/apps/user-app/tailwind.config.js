/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all of your component files.
    content: ['./screens/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './navigations/**/*.{js,jsx,ts,tsx}'],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {
            colors: {
                primary: '#6C63FF',
            },
            blue: {
                50: '#ecf0ff',
                100: '#dde2ff',
                200: '#c2caff',
                300: '#9ca6ff',
                400: '#7577ff',
                500: '#6c63ff',
                600: '#5036f5',
                700: '#452ad8',
                800: '#3825ae',
                900: '#312689',
                950: '#1f1650',
            },
        },
    },
    plugins: [],
}
