import React from 'react';

const PasswordStrengthIndicator = ({ strength, feedback, theme }) => {
    const getStrengthColor = () => {
        if (strength < 50) return 'bg-red-500';
        if (strength < 75) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStrengthText = () => {
        if (strength < 50) return 'Weak';
        if (strength < 75) return 'Medium';
        return 'Strong';
    };

    return (
        <div className="w-full max-w-xs sm:max-w-md mt-2">
            <div className="flex justify-between items-center mb-1">
                <span className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                    Password Strength
                </span>
                <span className={`text-xs font-medium ${getStrengthColor().replace('bg-', 'text-')}`}>
                    {getStrengthText()}
                </span>
            </div>
            
            <div className={`h-2 rounded-full ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'}`}>
                <div 
                    className={`h-full rounded-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${strength}%` }}
                />
            </div>
            
            {feedback.length > 0 && (
                <p className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                    Needs: {feedback.join(', ')}
                </p>
            )}
        </div>
    );
};

export default PasswordStrengthIndicator;
