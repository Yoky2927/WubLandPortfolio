import { Link } from 'react-router-dom';
import FloatingElements from "../components/FloatingElements";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useState, useEffect } from 'react';
import TermsModal from "../components/TermsModel.jsx";
import Loader from "../components/Loader";

const LoginRegister = () => {
    const [isSignUpMode, setIsSignUpMode] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [activeInput, setActiveInput] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        retypePassword: '',
        accountType: 'personal',
        acceptedTerms: false
    });
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

// Add this function to handle terms acceptance
    const handleAcceptTerms = () => {
        setAcceptedTerms(true);
        setShowTermsModal(false);
        setFormData(prev => ({ ...prev, acceptedTerms: true }));
    };

    useEffect(() => {
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(theme);
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const socialPlatforms = [
        {
            name: 'facebook',
            color: '',
            hoverColor: '#f59e0b',
            svgPath: (
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            )
        },
        {
            name: 'twitter',
            color: '',
            hoverColor: '#f59e0b',
            svgPath: (
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            )
        },
        {
            name: 'google',
            color: '',
            hoverColor: '#f59e0b',
            svgPath: (
                <>
                    <path  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </>
            )
        },
        {
            name: 'github',
            color:'',
            hoverColor: '#f59e0b',
            svgPath: (
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            )
        }
    ];
    const [isLoading, setIsLoading] = useState(false);

    const handleHomeClick = (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate loading delay
        setTimeout(() => {
            window.location.href = '/'; // Use window.location for full page navigation
        }, 4000);
    };
    return (
        <div
            className={`min-h-screen flex items-center justify-center overflow-x-hidden transition-all duration-1000 ease-in-out relative ${
                theme === "dark" ? "bg-gradient-to-r from-gray-900 via-black to-gray-900" : "bg-white"
            }`}
        >
            {/* Loader Component */}
            {isLoading && <Loader theme={theme} />}

            {/* Rest of your existing code */}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <FloatingElements theme={theme} reduced={true} />
            <TermsModal
                isOpen={showTermsModal}
                onClose={() => setShowTermsModal(false)}
                onAccept={handleAcceptTerms}
                theme={theme}
            />
            {/* Background Circle */}
            <div
                className="absolute top-32 right-[47%] translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] transition-all duration-1000 ease-in-out z-0 "
                style={{
                    backgroundImage: `url('/vectors/Rectangle38.svg')` , // make sure it's in /public folder
                    backgroundSize: 'cover',
                    opacity: 0.7,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    transform: isSignUpMode
                        ? 'translate(93%, -45%)'
                        : 'translateY(-50%)',
                }}
            />

            {/* Home Button */}
            <img src = "/vectors/LogoY.svg" alt="Logo" className="logoTop  absolute top-[5%] left-[12%]" />
            <div><Link
                to ="/"
                onClick={handleHomeClick}
                className="absolute text-white hover:text-white active:cursor-wait top-6 right-6 z-50 w-48 px-3 h-12 bg-amber-400  flex items-center justify-center shadow-lg hover:bg-amber-500 transition-all duration-300 group hover:scale-110"
            >
                <svg
                    className="w-6 h-6  transition-transform group-hover:scale-110 -ml-5 mr-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                </svg> Go back Home
            </Link>
            </div>

            <div className="relative w-full max-w-6xl mx-4">
                {/* Forms Container */}
                <div
                    className="absolute top-1/2 left-1/2 md:w-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-in-out z-30 pointer-events-auto"
                    style={{
                        left: isSignUpMode ? '25%' : '75%',
                    }}
                >
                    {/* Sign In Form */}
                    <form
                        className={`flex flex-col items-center justify-center px-6 sm:px-10 py-8 transition-all duration-300 ${
                            isSignUpMode ? 'opacity-0 pointer-events-none' : 'opacity-100'
                        }`}
                    >
                        <h2 className={`text-2xl sm:text-3xl font-bold mb-4 transition-colors duration-300 ${
                            theme === 'light' ? 'text-gray-800' : 'text-white'
                        }`}>
                            Sign in
                        </h2>

                        {/* Username */}
                        <div
                            className={`w-full max-w-xs sm:max-w-md my-3 h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${
                                activeInput === 'retypePassword'
                                    ? theme === 'light'
                                        ? 'bg-amber-50 shadow-md' // Light theme focused
                                        : 'bg-gray-700 shadow-md' // Dark theme focused
                                    : theme === 'light'
                                        ? 'bg-gray-100 hover:bg-gray-200' // Light theme, not focused
                                        : 'bg-gray-800 hover:bg-gray-700' // Dark theme, not focused
                            }`}
                            onFocus={() => setActiveInput('username')}
                            onBlur={() => setActiveInput(null)}
                        >
                            <div className="flex items-center justify-center">
                                <svg
                                    className={`w-5 h-5 transition-colors duration-300 ${
                                        activeInput === 'username' ? 'text-amber-600' : 'text-gray-400'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Username"
                                className={`bg-transparent outline-none border-none text-sm font-semibold placeholder-gray-500 transition-colors duration-300 ${
                                    theme === 'light'
                                        ? 'text-gray-700'
                                        : 'text-white bg-gray-800'  // Added bg color
                                }`}
                            />
                        </div>

                        {/* Password */}
                        <div
                            className={`w-full max-w-xs sm:max-w-md my-3 h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${
                                activeInput === 'retypePassword'
                                    ? theme === 'light'
                                        ? 'bg-amber-50 shadow-md' // Light theme focused
                                        : 'bg-gray-700 shadow-md' // Dark theme focused
                                    : theme === 'light'
                                        ? 'bg-gray-100 hover:bg-gray-200' // Light theme, not focused
                                        : 'bg-gray-800 hover:bg-gray-700' // Dark theme, not focused
                            }`}
                            onFocus={() => setActiveInput('password')}
                            onBlur={() => setActiveInput(null)}
                        >
                            <div className="flex items-center justify-center">
                                <svg
                                    className={`w-5 h-5 transition-colors duration-300 ${
                                        activeInput === 'password' ? 'text-amber-600' : 'text-gray-400'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <input
                                type="password"
                                placeholder="Password"
                                className={`bg-transparent outline-none border-none text-sm font-semibold placeholder-gray-500 transition-colors duration-300 ${
                                    theme === 'light'
                                        ? 'text-gray-700'
                                        : 'text-white bg-gray-800'  // Added bg color
                                }`}
                            />
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            className="w-32 sm:w-36 bg-amber-500 h-12  text-white font-semibold uppercase my-4 cursor-pointer transition-all duration-300 hover:bg-amber-600 hover:scale-105 hover:shadow-lg"
                        >
                            Login
                        </button>

                        {/* Socials */}
                        <p className={`text-xs sm:text-sm my-3 sm:my-4 transition-colors duration-300 ${
                            theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                        }`}>
                            Or Sign in with social platforms
                        </p>

                        <div className="flex justify-center space-x-2 sm:space-x-3">
                            {socialPlatforms.map(platform => (
                                <a
                                    key={platform.name}
                                    href="#"
                                    className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg ${
                                        theme === 'light'
                                            ? 'border border-gray-300 hover:border-amber-500'
                                            : 'border border-gray-700 hover:border-amber-500'
                                    }`}
                                    style={{
                                        backgroundColor: theme === 'light' ? 'white' : '#1f2937',
                                        color: theme === 'dark' ? 'white' : '#1f2937'
                                    }}
                                    onMouseOver={e => {
                                        if (platform.hoverColor) {
                                            e.currentTarget.style.color = platform.hoverColor;
                                        }
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.color = platform.color;
                                    }}
                                >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                                        {platform.svgPath}
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </form>

                    {/* Sign Up Form */}
                    <form className={`absolute -top-10 left-0 w-full flex flex-col items-center justify-center px-6 sm:px-10 py-8 transition-all duration-300 ${
                        isSignUpMode ? 'opacity-100 z-2 pointer-events-auto' : 'opacity-0 z-1 pointer-events-none'
                    }`}>
                        <h2 className={`text-2xl sm:text-3xl font-bold mb-4 transition-colors duration-300 ${
                            theme === 'light' ? 'text-amber-500' : 'text-white'
                        }`}>
                            Sign up
                        </h2>

                        <div className="w-full max-w-xs sm:max-w-md grid grid-cols-2 gap-3">
                            {/* First Name */}
                            <div
                                className={` h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${
                                    activeInput === 'retypePassword'
                                        ? theme === 'light'
                                            ? 'bg-amber-50 shadow-md' // Light theme focused
                                            : 'bg-gray-700 shadow-md' // Dark theme focused
                                        : theme === 'light'
                                            ? 'bg-gray-100 hover:bg-gray-200' // Light theme, not focused
                                            : 'bg-gray-800 hover:bg-gray-700' // Dark theme, not focused
                                }`}
                                onFocus={() => setActiveInput('firstName')}
                                onBlur={() => setActiveInput(null)}
                            >
                                <div className="flex items-center justify-center">
                                    <svg
                                        className={`w-4 h-4 transition-colors duration-300 ${
                                            activeInput === 'firstName' ? 'text-amber-600' : 'text-gray-400'
                                        }`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="First Name"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className={`bg-transparent outline-none border-none text-sm font-semibold placeholder-gray-500 transition-colors duration-300 ${
                                        theme === 'light'
                                            ? 'text-gray-700'
                                            : 'text-white bg-gray-800'  // Added bg color
                                    }`}
                                />
                            </div>

                            {/* Last Name */}
                            <div
                                className={` h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${
                                    activeInput === 'retypePassword'
                                        ? theme === 'light'
                                            ? 'bg-amber-50 shadow-md' // Light theme focused
                                            : 'bg-gray-700 shadow-md' // Dark theme focused
                                        : theme === 'light'
                                            ? 'bg-gray-100 hover:bg-gray-200' // Light theme, not focused
                                            : 'bg-gray-800 hover:bg-gray-700' // Dark theme, not focused
                                }`}
                                onFocus={() => setActiveInput('lastName')}
                                onBlur={() => setActiveInput(null)}
                            >
                                <div className="flex items-center justify-center">
                                    <svg
                                        className={`w-4 h-4 transition-colors duration-300 ${
                                            activeInput === 'lastName' ? 'text-amber-600' : 'text-gray-400'
                                        }`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Last Name"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className={`bg-transparent outline-none border-none text-sm font-semibold placeholder-gray-500 transition-colors duration-300 ${
                                        theme === 'light'
                                            ? 'text-gray-700'
                                            : 'text-white bg-gray-800'  // Added bg color
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div
                            className={`w-full max-w-xs sm:max-w-md  my-3 h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${
                                activeInput === 'retypePassword'
                                    ? theme === 'light'
                                        ? 'bg-amber-50 shadow-md' // Light theme focused
                                        : 'bg-gray-700 shadow-md' // Dark theme focused
                                    : theme === 'light'
                                        ? 'bg-gray-100 hover:bg-gray-200' // Light theme, not focused
                                        : 'bg-gray-800 hover:bg-gray-700' // Dark theme, not focused
                            }`}
                            onFocus={() => setActiveInput('username')}
                            onBlur={() => setActiveInput(null)}
                        >
                            <div className="flex items-center justify-center">
                                <svg
                                    className={`w-5 h-5 transition-colors duration-300 ${
                                        activeInput === 'username' ? 'text-amber-600' : 'text-gray-400'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className={`bg-transparent outline-none border-none text-sm font-semibold placeholder-gray-500 transition-colors duration-300 ${
                                    theme === 'light'
                                        ? 'text-gray-700'
                                        : 'text-white bg-gray-800'  // Added bg color
                                }`}
                            />
                        </div>

                        {/* Email */}
                        <div
                            className={`w-full max-w-xs sm:max-w-md mb-3 h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${
                                activeInput === 'retypePassword'
                                    ? theme === 'light'
                                        ? 'bg-amber-50 shadow-md' // Light theme focused
                                        : 'bg-gray-700 shadow-md' // Dark theme focused
                                    : theme === 'light'
                                        ? 'bg-gray-100 hover:bg-gray-200' // Light theme, not focused
                                        : 'bg-gray-800 hover:bg-gray-700' // Dark theme, not focused
                            }`}
                            onFocus={() => setActiveInput('email')}
                            onBlur={() => setActiveInput(null)}
                        >
                            <div className="flex items-center justify-center">
                                <svg
                                    className={`w-5 h-5 transition-colors duration-300 ${
                                        activeInput === 'email' ? 'text-amber-600' : 'text-gray-400'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                </svg>
                            </div>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`bg-transparent outline-none border-none text-sm font-semibold placeholder-gray-500 transition-colors duration-300 ${
                                    theme === 'light'
                                        ? 'text-gray-700'
                                        : 'text-white bg-gray-800'  // Added bg color
                                }`}
                            />
                        </div>

                        <div className="w-full max-w-xs sm:max-w-md grid grid-cols-2 gap-3">
                            {/* Password */}
                            <div
                                className={` h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${
                                    activeInput === 'retypePassword'
                                        ? theme === 'light'
                                            ? 'bg-amber-50 shadow-md' // Light theme focused
                                            : 'bg-gray-700 shadow-md' // Dark theme focused
                                        : theme === 'light'
                                            ? 'bg-gray-100 hover:bg-gray-200' // Light theme, not focused
                                            : 'bg-gray-800 hover:bg-gray-700' // Dark theme, not focused
                                }`}
                                onFocus={() => setActiveInput('password')}
                                onBlur={() => setActiveInput(null)}
                            >
                                <div className="flex items-center justify-center">
                                    <svg
                                        className={`w-4 h-4 transition-colors duration-300 ${
                                            activeInput === 'password' ? 'text-amber-600' : 'text-gray-400'
                                        }`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`bg-transparent outline-none border-none text-sm font-semibold placeholder-gray-500 transition-colors duration-300 ${
                                        theme === 'light'
                                            ? 'text-gray-700'
                                            : 'text-white bg-gray-800'  // Added bg color
                                    }`}
                                />
                            </div>

                            {/* Retype Password */}
                            <div
                                className={`h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${
                                    activeInput === 'retypePassword'
                                        ? theme === 'light'
                                            ? 'bg-amber-50  shadow-md' // Light theme focused
                                            : 'bg-gray-700  shadow-md' // Dark theme focused
                                        : theme === 'light'
                                            ? 'bg-gray-100 hover:bg-gray-200' // Light theme, not focused
                                            : 'bg-gray-800 hover:bg-gray-700' // Dark theme, not focused
                                }`}
                                onFocus={() => setActiveInput('retypePassword')}
                                onBlur={() => setActiveInput(null)}
                            >
                                <div className="flex items-center justify-center ">
                                    <svg
                                        className={`w-4 h-4 transition-colors duration-300 ${
                                            activeInput === 'retypePassword' ? 'text-amber-600' : 'text-gray-400'
                                        }`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    name="retypePassword"
                                    placeholder="Retype Password"
                                    value={formData.retypePassword}
                                    onChange={handleInputChange}
                                    className={`bg-transparent outline-none border-none text-sm font-semibold placeholder-gray-500 transition-colors duration-300 ${
                                        theme === 'light'
                                            ? 'text-gray-700'
                                            : 'text-white bg-gray-800 focus:bg-gray-700'  // Added bg color
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Account Type Dropdown */}
                        <div
                            className={`w-full max-w-xs sm:max-w-md my-3 h-12 grid grid-cols-[15%_85%] px-3 transition-all duration-300 ${
                                activeInput === 'retypePassword'
                                    ? theme === 'light'
                                        ? 'bg-amber-50 ' // Light theme focused
                                        : 'bg-gray-700 ' // Dark theme focused
                                    : theme === 'light'
                                        ? 'bg-gray-100 hover:bg-gray-200' // Light theme, not focused
                                        : 'bg-gray-800 hover:bg-gray-700' // Dark theme, not focused
                            }`}
                            onFocus={() => setActiveInput('accountType')}
                            onBlur={() => setActiveInput(null)}
                        >
                            <div className="flex items-center justify-center">
                                <svg
                                    className={`w-5 h-5 transition-colors duration-300 ${
                                        activeInput === 'accountType' ? 'text-amber-600' : 'text-gray-400'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                                </svg>
                            </div>
                            <select
                                name="accountType"
                                value={formData.accountType}
                                onChange={handleInputChange}
                                className={`bg-transparent outline-none border-none text-sm font-semibold transition-colors duration-300 ${
                                    theme === 'light'
                                        ? 'text-gray-700'
                                        : 'text-white bg-gray-800 '  // Added bg color for dark mode
                                }`}
                            >
                                <option value="" disabled className={theme === 'light' ? 'text-gray-700' : 'text-white bg-gray-800'}>Select Account Type</option>
                                <option value="Broker" className={theme === 'light' ? 'text-gray-700' : 'text-white bg-gray-800'}>Brokers Account</option>
                                <option value="Seller" className={theme === 'light' ? 'text-gray-700' : 'text-white bg-gray-800'}>Sellers Account</option>
                                <option value="Buyer" className={theme === 'light' ? 'text-gray-700' : 'text-white bg-gray-800'}>Buyers Account</option>
                                <option value="Renter" className={theme === 'light' ? 'text-gray-700' : 'text-white bg-gray-800'}>Renters Account</option>
                            </select>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="w-full max-w-xs sm:max-w-md flex items-center my-3">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="acceptedTerms"
                                    checked={formData.acceptedTerms}
                                    onChange={() => setShowTermsModal(true)}
                                    className="hidden"
                                />
                                <div className={`w-5 h-5  border-2 flex items-center justify-center mr-2 transition-all duration-300 ${
                                    formData.acceptedTerms
                                        ? 'bg-amber-500 border-amber-500'
                                        : theme === 'light'
                                            ? 'border-gray-300'
                                            : 'border-gray-600'
                                }`}>
                                    {formData.acceptedTerms && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`text-xs transition-colors duration-300 ${
                                    theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                                }`}>
      I have read and agree to the <span
                                    className="text-amber-500 hover:underline cursor-pointer"
                                    onClick={() => setShowTermsModal(true)}
                                >
        Terms and Conditions
      </span>
    </span>
                            </label>
                        </div>


                        <button
                            type="submit"
                            className="w-32 sm:w-36 bg-amber-500 h-12 text-white font-semibold uppercase my-4 cursor-pointer transition-all duration-300 hover:bg-amber-600 hover:scale-105 hover:shadow-lg text-sm sm:text-base"
                            disabled={!formData.acceptedTerms}
                        >
                            Sign up
                        </button>

                        <p className={`text-xs sm:text-sm my-3 sm:my-4 transition-colors duration-300 ${
                            theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                        }`}>
                            Or Sign up with social platforms
                        </p>

                        <div className="flex justify-center space-x-2 sm:space-x-3">
                            {socialPlatforms.map(platform => (
                                <a
                                    key={platform.name}
                                    href="#"
                                    className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center  transition-all duration-300 hover:scale-110 hover:shadow-lg ${
                                        theme === 'light'
                                            ? 'border border-gray-300 hover:border-amber-500'
                                            : 'border border-gray-700 hover:border-amber-500'
                                    }`}
                                    style={{
                                        backgroundColor: theme === 'light' ? 'white' : '#1f2937',
                                        color: platform.color
                                    }}
                                    onMouseOver={e => {
                                        if (platform.hoverColor) {
                                            e.currentTarget.style.color = platform.hoverColor;
                                        }
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.color = platform.color;
                                    }}
                                >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                                        {platform.svgPath}
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </form>
                </div>

                {/* Panels */}
                <div className="inset-0 grid grid-cols-1 md:grid-cols-2 z-20">
                    {/* Left Panel */}
                    <div className="flex flex-1 flex-col items-center md:items-end justify-center text-center md:text-right pr-4 md:pr-12">
                        <div className={`transition-transform duration-700 ${
                            theme === 'light' ? 'text-gray-800' : 'text-white'
                        }`}
                             style={{ transform: isSignUpMode ? 'translateX(-800px)' : 'translateX(0)' }}>
                            <h3 className="text-xl md:text-2xl font-semibold mb-2">New here?</h3>
                            <p className="text-sm mb-4 max-w-xs">
                                Join our community and discover amazing properties!
                            </p>
                            <button onClick={() => setIsSignUpMode(true)}
                                    className={`border-2 bg-transparent w-28 md:w-32 h-9 md:h-10  font-semibold text-xs md:text-sm transition-all duration-300 hover:scale-105 ${
                                        theme === 'light'
                                            ? 'border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white'
                                            : 'border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-gray-900'
                                    }`}>
                                Sign up
                            </button>
                        </div>
                        <img src="/vectors/Login.svg" alt="Login" className="w-[80%] max-w-lg transition-transform duration-700"
                             style={{ transform: isSignUpMode ? 'translateX(-800px)' : 'translateX(0)' }} />
                    </div>

                    {/* Right Panel */}
                    <div className="flex flex-col items-center md:items-start justify-center text-center md:text-left pl-4 md:pl-12">
                        <div className={`transition-transform duration-700 ${
                            theme === 'light' ? 'text-gray-800' : 'text-white'
                        }`}
                             style={{ transform: isSignUpMode ? "translateX(0)" : "translateX(800px)" }}>
                            <h3 className="text-xl md:text-2xl font-semibold mb-2">One of us?</h3>
                            <p className="text-sm mb-4 max-w-xs">
                                Welcome back! Sign in to continue your journey.
                            </p>
                            <button onClick={() => setIsSignUpMode(false)}
                                    className={`border-2 bg-transparent w-28 md:w-32 h-9 md:h-10  font-semibold text-xs md:text-sm transition-all duration-300 hover:scale-105 ${
                                        theme === 'light'
                                            ? 'border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white'
                                            : 'border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-gray-900'
                                    }`}>
                                Login
                            </button>
                        </div>
                        <img src="/vectors/Signup.svg" alt="Register" className="w-[80%] max-w-lg transition-transform duration-700"
                             style={{ transform: isSignUpMode ? "translateX(0)" : "translateX(800px)" }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginRegister;