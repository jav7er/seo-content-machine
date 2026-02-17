'use client';

import { useState } from 'react';

interface ConnectionTestProps {
  credentials: any;
}

interface TestResult {
  service: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export function ConnectionTest({ credentials }: ConnectionTestProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([
    { service: 'wordpress', status: 'pending', message: 'Not tested' },
    { service: 'gsc', status: 'pending', message: 'Not tested' },
    { service: 'ga4', status: 'pending', message: 'Not tested' },
    { service: 'openrouter', status: 'pending', message: 'Not tested' },
  ]);
  const [testing, setTesting] = useState<string[]>([]);

  const serviceNames = {
    wordpress: 'WordPress API',
    gsc: 'Google Search Console',
    ga4: 'Google Analytics 4',
    openrouter: 'OpenRouter API',
  };

  const testService = async (service: string) => {
    setTesting(prev => [...prev, service]);
    setTestResults(prev =>
      prev.map(result =>
        result.service === service
          ? { ...result, status: 'pending', message: 'Testing...' }
          : result
      )
    );

    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service, credentials }),
      });

      const data = await response.json();
      
      setTestResults(prev =>
        prev.map(result =>
          result.service === service
            ? {
                ...result,
                status: data.success ? 'success' : 'error',
                message: data.message || data.error || 'Test failed',
              }
            : result
        )
      );
    } catch (error) {
      setTestResults(prev =>
        prev.map(result =>
          result.service === service
            ? {
                ...result,
                status: 'error',
                message: `Connection error: ${error}`,
              }
            : result
        )
      );
    } finally {
      setTesting(prev => prev.filter(s => s !== service));
    }
  };

  const testAllServices = async () => {
    const services = ['wordpress', 'gsc', 'ga4', 'openrouter'];
    await Promise.all(services.map(service => testService(service)));
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'pending':
        return '⏳';
      default:
        return '?';
    }
  };

  return (
    <div className="mt-12 border-t pt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Connection Tests</h2>
      <p className="text-sm text-gray-600 mb-6">
        Test your credentials to verify each service is working correctly.
      </p>

      <div className="mb-6">
        <button
          onClick={testAllServices}
          disabled={testing.length > 0}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {testing.length > 0 ? 'Testing All Services...' : 'Test All Services'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testResults.map((result) => (
          <div
            key={result.service}
            className={`border rounded-lg p-4 ${
              result.status === 'success'
                ? 'border-green-200'
                : result.status === 'error'
                ? 'border-red-200'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">
                {serviceNames[result.service as keyof typeof serviceNames]}
              </h3>
              <button
                onClick={() => testService(result.service)}
                disabled={testing.includes(result.service)}
                className="px-3 py-1 text-xs font-medium rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {testing.includes(result.service) ? 'Testing...' : 'Test'}
              </button>
            </div>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
              <span className="mr-1">{getStatusIcon(result.status)}</span>
              {result.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}