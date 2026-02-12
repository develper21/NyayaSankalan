/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eaf2f8',
          100: '#d4e6f1',
          200: '#a9cce3',
          300: '#7fb3d5',
          400: '#5499c7',
          500: '#1B4F72',
          600: '#154360',
          700: '#0e3750',
          800: '#082b40',
          900: '#041f30',
        },
        government: {
          50: '#FFFFFF',
          100: '#f5f5f5',
          200: '#e0e0e0',
          300: '#cccccc',
          400: '#999999',
          500: '#666666',
          600: '#333333',
          700: '#1a1a1a',
          800: '#0d0d0d',
          900: '#000000',
        },
      },
    },
  },
  plugins: [],
}
