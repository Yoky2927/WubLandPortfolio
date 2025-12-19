// TermsModal.jsx
import { useState, useEffect } from 'react';

const TermsModal = ({ isOpen, onClose, onAccept }) => {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [contentRef, setContentRef] = useState(null);

    useEffect(() => {
        // Reset scroll state when modal opens
        if (isOpen) {
            setHasScrolledToBottom(false);
            if (contentRef) {
                contentRef.scrollTop = 0;
            }
        }
    }, [isOpen, contentRef]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

        if (isAtBottom) {
            setHasScrolledToBottom(true);
        }
    };

    return (
        <div className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ${isOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 pointer-events-none'}`}>
            {/* Background overlay with theme-based blur */}
            <div className={`absolute inset-0 ${isOpen ? 'bg-black bg-opacity-40' : 'bg-opacity-0'}`} onClick={onClose}></div>

            <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-transform duration-300">
                {/* Header with gradient */}
                <div className="p-6 bg dark:to-gray-900 text-center">
                    <div className="flex justify-between  items-center">
                        <h3 className="text-xl font-bold  ml-52 text-white text-center">Terms & Conditions</h3>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-amber-100 transition-colors duration-200 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-amber-100 text-sm mt-1">Please read carefully before proceeding</p>
                </div>

                {/* Scrollable content */}
                <div
                    ref={setContentRef}
                    onScroll={handleScroll}
                    className="p-6 overflow-y-auto flex-grow bg-white dark:bg-gray-800"
                >
                    <div className="space-y-6">
                        {/* Decorative elements */}
                        <div className="flex items-center mb-4">
                            <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent flex-grow"></div>
                            <div className="mx-4 text-amber-500">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent flex-grow"></div>
                        </div>

                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                            <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
                            1. Introduction
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 pl-5 border-l-2 border-amber-200 dark:border-amber-700">
                            Welcome to our platform. These terms and conditions govern your use of our website and services. By accessing or using our platform, you agree to be bound by these terms.
                        </p>

                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                            <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
                            2. Account Registration
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 pl-5 border-l-2 border-amber-200 dark:border-amber-700">
                            You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                        </p>

                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                            <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
                            3. User Responsibilities
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 pl-5 border-l-2 border-amber-200 dark:border-amber-700">
                            You agree to use our services only for lawful purposes and in accordance with these terms. You must not misuse our platform by knowingly introducing viruses or other malicious material.
                        </p>

                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                            <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
                            4. Password Security
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 pl-5 border-l-2 border-amber-200 dark:border-amber-700">
                            Sharing your password with others is strictly prohibited. You are solely responsible for any activities that occur under your account, whether authorized by you or not.
                        </p>

                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                            <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
                            5. Intellectual Property
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 pl-5 border-l-2 border-amber-200 dark:border-amber-700">
                            All content on this platform, including text, graphics, logos, and software, is the property of our company and is protected by intellectual property laws.
                        </p>

                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                            <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
                            6. Privacy Policy
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 pl-5 border-l-2 border-amber-200 dark:border-amber-700">
                            Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information.
                        </p>

                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                            <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
                            7. Termination
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 pl-5 border-l-2 border-amber-200 dark:border-amber-700">
                            We reserve the right to terminate or suspend your account at our sole discretion, without notice, for conduct that we believe violates these terms or is harmful to other users.
                        </p>

                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                            <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
                            8. Limitation of Liability
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 pl-5 border-l-2 border-amber-200 dark:border-amber-700">
                            To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.
                        </p>

                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                            <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
                            9. Changes to Terms
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 pl-5 border-l-2 border-amber-200 dark:border-amber-700">
                            We may modify these terms at any time. We will notify you of significant changes, and continued use of our services constitutes acceptance of the modified terms.
                        </p>

                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                            <span className="w-2 h-2 bg-amber-400 rounded-full mr-3"></span>
                            10. Acceptance
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 pl-5 border-l-2 border-amber-200 dark:border-amber-700">
                            By creating an account, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions in their entirety.
                        </p>

                        {/* Scroll indicator */}
                        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-800 dark:via-gray-800 dark:to-transparent pt-8 pb-4 text-center">
                            <div className="inline-flex items-center text-sm text-amber-500 dark:text-amber-400">
                                <svg className={`w-4 h-4 mr-2 transition-all duration-300 ${hasScrolledToBottom ? 'opacity-0' : 'opacity-100'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <span className={hasScrolledToBottom ? 'text-green-500' : ''}>
                                    {hasScrolledToBottom ? '✓ Ready to accept' : 'Scroll to continue'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer with accept button */}
                <div className="p-6  dark:bg-gray-850 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onAccept}
                        disabled={!hasScrolledToBottom}
                        className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${
                            hasScrolledToBottom
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg'
                                : 'bg-gray-200 dark:bg-gray-700 text-white dark:text-white cursor-not-allowed'
                        }`}
                    >
                        {hasScrolledToBottom ? (
                            <span className="flex items-center justify-center text-white">
                                Accept Terms & Continue
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        ) : (
                            'Please read all terms to continue'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;