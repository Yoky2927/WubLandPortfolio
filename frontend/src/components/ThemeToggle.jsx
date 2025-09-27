import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
        theme === 'dark'
          ? 'bg-amber-400 shadow-lg shadow-amber-400/30'
          : 'bg-gray-800 shadow-lg shadow-gray-800/30'
      } hover:scale-110 fixed bottom-6 right-20 z-50`}
      type="button"
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <div className="relative w-8 h-8">
        {/* Sun Icon (shown in dark mode) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`absolute top-0 left-0 w-8 h-8 transition-all duration-500 ease-in-out ${
            theme === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-75'
          }`}
          viewBox="0 0 32 32"
          fill="#f59e0b" // amber-400
        >
          <clipPath id="theme-toggle__within__clip">
            <path d="M0 0h32v32h-32ZM6 16A1 1 0 0026 16 1 1 0 006 16" />
          </clipPath>
          <g clipPath="url(#theme-toggle__within__clip)">
            <path d="M30.7 21.3 27.1 16l3.7-5.3c.4-.5.1-1.3-.6-1.4l-6.3-1.1-1.1-6.3c-.1-.6-.8-.9-1.4-.6L16 5l-5.4-3.7c-.5-.4-1.3-.1-1.4.6l-1 6.3-6.4 1.1c-.6.1-.9.9-.6 1.3L4.9 16l-3.7 5.3c-.4.5-.1 1.3.6 1.4l6.3 1.1 1.1 6.3c.1.6.8.9 1.4.6l5.3-3.7 5.3 3.7c.5.4 1.3.1 1.4-.6l1.1-6.3 6.3-1.1c.8-.1 1.1-.8.7-1.4zM16 25.1c-5.1 0-9.1-4.1-9.1-9.1 0-5.1 4.1-9.1 9.1-9.1s9.1 4.1 9.1 9.1c0 5.1-4 9.1-9.1 9.1z" />
          </g>
          <path
            className="theme-toggle__within__circle"
            d="M16 7.7c-4.6 0-8.2 3.7-8.2 8.2s3.6 8.4 8.2 8.4 8.2-3.7 8.2-8.2-3.6-8.4-8.2-8.4zm0 14.4c-3.4 0-6.1-2.9-6.1-6.2s2.7-6.1 6.1-6.1c3.4 0 6.1 2.9 6.1 6.2s-2.7 6.1-6.1 6.1z"
          />
          <path
            className="theme-toggle__within__inner"
            d="M16 9.5c-3.6 0-6.4 2.9-6.4 6.4s2.8 6.5 6.4 6.5 6.4-2.9 6.4-6.4-2.8-6.5-6.4-6.5z"
          />
        </svg>

        {/* Moon Icon (shown in light mode) - Updated with amber-400 fill */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`absolute top-0 left-0 w-8 h-8 transition-all duration-500 ease-in-out ${
            theme === 'light'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-75'
          }`}
          viewBox="0 0 24 24"
          fill="#f59e0b" // amber-400
          stroke="#f59e0b" // gray-800 outline
          strokeWidth="1.5"
        >
          <path
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </button>
  );
};

export default ThemeToggle;