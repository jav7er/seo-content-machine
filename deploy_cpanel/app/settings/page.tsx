'use client';

import { useState, useEffect } from 'react';
import { CredentialsForm } from '../../components/CredentialsForm';
import { ConnectionTest } from '../../components/ConnectionTest';

interface Credentials {
  NEXT_PUBLIC_WORDPRESS_URL: string;
  WORDPRESS_USERNAME: string;
  WORDPRESS_APP_PASSWORD: string;
  GSC_SITE_URL: string;
  GSC_CLIENT_EMAIL: string;
  GSC_PRIVATE_KEY: string;
  GA4_PROPERTY_ID: string;
  GA4_CLIENT_EMAIL: string;
  GA4_PRIVATE_KEY: string;
  OPENROUTER_API_KEY: string;
  OPENROUTER_MODEL: string;
}

export default function SettingsPage() {
  const [credentials, setCredentials] = useState<Credentials>({
    NEXT_PUBLIC_WORDPRESS_URL: '',
    WORDPRESS_USERNAME: '',
    WORDPRESS_APP_PASSWORD: '',
    GSC_SITE_URL: '',
    GSC_CLIENT_EMAIL: '',
    GSC_PRIVATE_KEY: '',
    GA4_PROPERTY_ID: '',
    GA4_CLIENT_EMAIL: '',
    GA4_PRIVATE_KEY: '',
    OPENROUTER_API_KEY: '',
    OPENROUTER_MODEL: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const response = await fetch('/api/credentials');
      const data = await response.json();
      
      if (data.success) {
        setCredentials(data.credentials);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading credentials' });
    } finally {
      setLoading(false);
    }
  };

  const saveCredentials = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credentials }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Credentials saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving credentials' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading credentials...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">
              Credentials Configuration
            </h1>

            {message && (
              <div
                className={`mb-6 p-4 rounded-md ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-8">
              <CredentialsForm
                title="WordPress API"
                description="Configure WordPress REST API credentials"
                fields={[
                  {
                    key: 'NEXT_PUBLIC_WORDPRESS_URL',
                    label: 'WordPress URL',
                    type: 'text',
                    placeholder: 'https://yoursite.com/wp-json'
                  },
                  {
                    key: 'WORDPRESS_USERNAME',
                    label: 'Username',
                    type: 'text',
                    placeholder: 'username'
                  },
                  {
                    key: 'WORDPRESS_APP_PASSWORD',
                    label: 'Application Password',
                    type: 'password',
                    placeholder: 'app password'
                  }
                ]}
                credentials={credentials}
                setCredentials={setCredentials as any}
              />

              <CredentialsForm
                title="Google Search Console"
                description="Configure GSC service account credentials"
                fields={[
                  {
                    key: 'GSC_SITE_URL',
                    label: 'Site URL',
                    type: 'text',
                    placeholder: 'sc-domain:yourdomain.com'
                  },
                  {
                    key: 'GSC_CLIENT_EMAIL',
                    label: 'Client Email',
                    type: 'email',
                    placeholder: 'service-account@project.iam.gserviceaccount.com'
                  },
                  {
                    key: 'GSC_PRIVATE_KEY',
                    label: 'Private Key',
                    type: 'textarea',
                    placeholder: '-----BEGIN PRIVATE KEY-----'
                  }
                ]}
                credentials={credentials}
                setCredentials={setCredentials as any}
              />

              <CredentialsForm
                title="Google Analytics 4"
                description="Configure GA4 service account credentials"
                fields={[
                  {
                    key: 'GA4_PROPERTY_ID',
                    label: 'Property ID',
                    type: 'text',
                    placeholder: '123456789'
                  },
                  {
                    key: 'GA4_CLIENT_EMAIL',
                    label: 'Client Email',
                    type: 'email',
                    placeholder: 'service-account@project.iam.gserviceaccount.com'
                  },
                  {
                    key: 'GA4_PRIVATE_KEY',
                    label: 'Private Key',
                    type: 'textarea',
                    placeholder: '-----BEGIN PRIVATE KEY-----'
                  }
                ]}
                credentials={credentials}
                setCredentials={setCredentials as any}
              />

              <CredentialsForm
                title="OpenRouter API"
                description="Configure OpenRouter API credentials"
                fields={[
                  {
                    key: 'OPENROUTER_API_KEY',
                    label: 'API Key',
                    type: 'password',
                    placeholder: 'sk-or-v1-...'
                  },
                  {
                    key: 'OPENROUTER_MODEL',
                    label: 'Model',
                    type: 'text',
                    placeholder: 'google/gemini-2.0-flash-001'
                  }
                ]}
                credentials={credentials}
                setCredentials={setCredentials as any}
              />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="flex space-x-4">
                <button
                  onClick={saveCredentials}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Credentials'}
                </button>
                <button
                  onClick={loadCredentials}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reload
                </button>
              </div>
            </div>

            <ConnectionTest credentials={credentials} />
          </div>
        </div>
      </div>
    </div>
  );
}