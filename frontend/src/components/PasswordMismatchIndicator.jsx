import React from 'react';

const PasswordMismatchIndicator = ({ password, retypePassword, isSignUpMode }) => {
    if (!isSignUpMode || !retypePassword || password === retypePassword) {
        return null;
    }

    return (
        <p className="text-red-500 text-xs mt-1">
            Passwords don't match
        </p>
    );
};

export default PasswordMismatchIndicator;
