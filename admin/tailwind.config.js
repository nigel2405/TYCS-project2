/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#25CCF7',
          50: '#E6F8FD',
          100: '#CCF1FB',
          500: '#25CCF7',
          600: '#1FA5C9',
          700: '#187E9B',
        },
        secondary: {
          DEFAULT: '#55E6C1',
          50: '#F0FDF9',
          100: '#E0FBF3',
          500: '#55E6C1',
          600: '#3DB89F',
          700: '#2D8A7D',
        },
        success: {
          DEFAULT: '#58B19F',
          500: '#58B19F',
          600: '#479085',
        },
        slate: {
          950: '#020617',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #25CCF7 0%, #55E6C1 100%)',
        'gradient-dark': 'linear-gradient(135deg, rgba(37, 204, 247, 0.1) 0%, rgba(85, 230, 193, 0.1) 100%)',
        'gradient-surface': 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-primary': '0 0 20px rgba(37, 204, 247, 0.3)',
        'glow-secondary': '0 0 20px rgba(85, 230, 193, 0.3)',
        'premium': '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
