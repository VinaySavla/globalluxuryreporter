const typography = require('@tailwindcss/typography');

module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#951D32',
        heading: '#6B0F22',
        wine: '#420112',
        ink: '#1C0007',
        cream: '#F7F2EC',
        parchment: '#EDE7E1'
      },
      fontFamily: {
        serif: ['var(--font-cormorant)'],
        sans: ['var(--font-poppins)']
      },
      letterSpacing: { editorial: '0.13em' },
      maxWidth: { editorial: '1440px' }
    }
  },
  plugins: [typography]
};
