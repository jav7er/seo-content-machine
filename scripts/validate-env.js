/**
 * Simple script to validate required environment variables before starting the app
 */
const requiredVars = [
  'NEXT_PUBLIC_WORDPRESS_URL',
  'WORDPRESS_USERNAME',
  'WORDPRESS_APP_PASSWORD',
  'GSC_SITE_URL',
  'GSC_CLIENT_EMAIL',
  'GSC_PRIVATE_KEY',
  'GA4_PROPERTY_ID',
  'OPENROUTER_API_KEY'
];

console.log('--- Environment Validation ---');
const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(m => console.error(`   - ${m}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set.');
console.log('------------------------------');
