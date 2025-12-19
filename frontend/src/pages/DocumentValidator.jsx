import { useState, useEffect } from 'react';
import axios from 'axios';

function DocumentValidator() {
    const [file, setFile] = useState(null);
    const [review, setReview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    useEffect(() => {
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(theme);
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a document');
            return;
        }

        setError('');
        setReview(null);
        setLoading(true);

        const formData = new FormData();
        formData.append('document', file);

        try {
            const response = await axios.post('http://localhost:3001/validate', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 300000,
            });
            setReview(response.data);
        } catch (err) {
            setError(`Validation failed: ${err.message}. Please try again or check the document format/server.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${theme === 'dark' ? 'dark-bg' : 'light-bg'} ${theme === 'dark' ? 'dark-hover' : 'light-hover'}`}>
            <div className={`p-6 rounded-lg shadow-lg w-full max-w-md`}>
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold font-poppins">
                        WubLand Document Validation
                    </h1>
                    <button onClick={toggleTheme} className="button">
                        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </button>
                </div>

                <input
                    type="file"
                    accept=".png,.jpg,.pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="mb-4 w-full p-2 border rounded font-poppins"
                />
                <button
                    onClick={handleUpload}
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-all duration-300 font-poppins scale-100 hover:scale-105"
                >
                    Validate Document
                </button>

                {loading && (
                    <div className="flex items-center justify-center mt-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-blue-500 font-poppins">Processing your document...</span>
                    </div>
                )}

                {error && (
                    <p className="text-red-500 mt-4 text-center font-poppins">
                        {error}
                    </p>
                )}

                {review && (
                    <div className="mt-4 p-4 rounded-lg border">
                        <h2 className="text-xl font-semibold font-poppins">
                            Validation Report
                        </h2>
                        <div className="space-y-2">
                            <p className="font-poppins">
                                <strong>Status:</strong>{' '}
                                <span className={review.status === 'valid' ? 'text-green-600' : 'text-red-600'}>
                  {review.status}
                </span>
                            </p>
                            <p className="font-poppins"><strong>Conclusion:</strong> {review.conclusion}</p>
                            <p className="font-poppins"><strong>Reasons:</strong></p>
                            <ul className="list-disc pl-5 font-poppins">
                                {review.reasons.map((reason, index) => (
                                    <li key={index}>{reason}</li>
                                ))}
                            </ul>
                            <p className="font-poppins"><strong>Details:</strong></p>
                            <ul className="list-disc pl-5 font-poppins">
                                <li>Document Type: {review.details.document_type}</li>
                                <li>Property ID: {review.details.property_id || 'N/A'}</li>
                                <li>Owner: {review.details.owner_name || review.details.taxpayer_name || 'N/A'}</li>
                                <li>Location: {review.details.location || 'N/A'}</li>
                                <li>Lease Duration: {review.details.lease_duration || 'N/A'}</li>
                                <li>TIN: {review.details.tin || 'N/A'}</li>
                                <li>Document Number: {review.details.document_number || 'N/A'}</li>
                                <li>Notary Seal: {review.details.has_notary_seal ? 'Present' : 'Absent'}</li>
                                <li>BERT Valid: {review.details.bert_valid ? 'Yes' : 'No'}</li>
                                <li>RF Valid: {review.details.rf_valid ? 'Yes' : 'No'}</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DocumentValidator;