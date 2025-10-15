import { useEffect, useState } from 'react';

const DebugAuth = () => {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setTokenInfo({
          tokenExists: true,
          tokenLength: token.length,
          payload: payload,
          role: payload.role,
          rawToken: token
        });
      } catch (err) {
        setError('Error decoding token: ' + err.message);
      }
    } else {
      setError('No token found in localStorage');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {tokenInfo && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Token Information</h2>
          <div className="space-y-2">
            <p><strong>Token Exists:</strong> {tokenInfo.tokenExists ? 'Yes' : 'No'}</p>
            <p><strong>Token Length:</strong> {tokenInfo.tokenLength} characters</p>
            <p><strong>User Role:</strong> <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{tokenInfo.role || 'No role found'}</span></p>
            <p><strong>Full Payload:</strong></p>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(tokenInfo.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login-register';
          }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mr-4"
        >
          Clear Token & Login Again
        </button>
        
        <button 
          onClick={() => window.location.href = '/super-admin/dashboard'}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-4"
        >
          Try Super Admin Dashboard
        </button>

        <button 
          onClick={() => window.location.href = '/admin/dashboard'}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Try Admin Dashboard
        </button>
      </div>
    </div>
  );
};

export default DebugAuth;