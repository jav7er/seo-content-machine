'use client';

interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea';
  placeholder: string;
}

interface CredentialsFormProps {
  title: string;
  description: string;
  fields: FieldConfig[];
  credentials: any;
  setCredentials: React.Dispatch<React.SetStateAction<any>>;
}

export function CredentialsForm({
  title,
  description,
  fields,
  credentials,
  setCredentials,
}: CredentialsFormProps) {
  const handleInputChange = (key: string, value: string) => {
    setCredentials((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label htmlFor={field.key} className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                id={field.key}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={field.placeholder}
                value={credentials[field.key] || ''}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
              />
            ) : (
              <input
                type={field.type}
                id={field.key}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={field.placeholder}
                value={credentials[field.key] || ''}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}