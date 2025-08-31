/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                'poppins': ['Poppins', 'sans-serif'],
            },
            screens: {
                'xs': { 'max': '320px' }, // custom breakpoint
            },
            animation: {
                'float-slow': 'float 12s ease-in-out infinite',
                'float-very-slow': 'float 18s ease-in-out infinite',
                'twinkle': 'twinkle 4s ease-in-out infinite',
            },
            keyframes: {
                    float: {
                        '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                        '50%': { transform: 'translateY(-25px) rotate(5deg)' },
                    },
                twinkle: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.4' },
                }
            }
        },
    },
    plugins: [],
};