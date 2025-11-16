import { useState } from 'react';
import { isDemoMode, disableDemoMode } from '../utils/mockData';
import { useNavigate } from 'react-router-dom';

const DemoModeBanner = ({ theme }) => {
    const [showBanner, setShowBanner] = useState(isDemoMode());
    const navigate = useNavigate();

    if (!showBanner) return null;

    const handleDisableDemo = () => {
        disableDemoMode();
        setShowBanner(false);
        navigate('/login-register');
    };

    return (
        <div className={`w-full py-3 px-4 text-center ${
            theme === 'dark' 
                ? 'bg-amber-900/30 border-b border-amber-700/50' 
                : 'bg-amber-100 border-b border-amber-300'
        }`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
                <div className="flex-1 text-center sm:text-left">
                    <p className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-amber-300' : 'text-amber-800'
                    }`}>
                        <span className="font-bold">🎭 Demo Mode Active:</span> You're viewing mock data. 
                        This allows you to preview the admin features without a backend connection.
                    </p>
                </div>
                <button
                    onClick={handleDisableDemo}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        theme === 'dark'
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                >
                    Exit Demo Mode
                </button>
            </div>
        </div>
    );
};

export default DemoModeBanner;

