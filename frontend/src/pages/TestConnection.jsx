import React, { useState, useEffect } from 'react';

const TestConnection = () => {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    testConnections();
  }, []);

  const testConnections = async () => {
    const newErrors = [];

    // Test backend health
    try {
      const healthResponse = await fetch('/api/health');
      if (healthResponse.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
        newErrors.push('Backend health check failed');
      }
    } catch (error) {
      setBackendStatus('error');
      newErrors.push(`Backend connection failed: ${error.message}`);
    }


    setErrors(newErrors);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Connection Test
          </h1>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">Backend Server</h3>
                <p className="text-sm text-gray-600">Health check endpoint</p>
              </div>
              <div className={`flex items-center ${getStatusColor(backendStatus)}`}>
                <span className="mr-2">{getStatusIcon(backendStatus)}</span>
                <span className="capitalize">{backendStatus}</span>
              </div>
            </div>

          </div>

          {errors.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Errors Found:</h3>
              <ul className="list-disc list-inside text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex space-x-4">
            <button
              onClick={testConnections}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestConnection;
