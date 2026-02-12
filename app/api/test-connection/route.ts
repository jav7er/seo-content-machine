import { NextRequest, NextResponse } from 'next/server';

async function testWordPress(url: string, username: string, password: string) {
  try {
    const response = await fetch(`${url}/wp/v2/users/me`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
      },
    });

    if (response.ok) {
      const user = await response.json();
      return { success: true, message: `Connected as: ${user.name}`, data: user };
    } else {
      return { success: false, message: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error) {
    return { success: false, message: `Connection error: ${error}` };
  }
}

async function testGoogleSearchConsole(siteUrl: string, clientEmail: string, privateKey: string) {
  try {
    // Basic validation of credentials
    if (!siteUrl || !clientEmail || !privateKey) {
      return { success: false, message: 'Missing required credentials' };
    }

    if (!siteUrl.startsWith('sc-domain:') && !siteUrl.startsWith('https://')) {
      return { success: false, message: 'Invalid site URL format' };
    }

    if (!clientEmail.includes('@')) {
      return { success: false, message: 'Invalid client email format' };
    }

    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      return { success: false, message: 'Invalid private key format' };
    }

    return { success: true, message: 'Google Search Console credentials appear valid' };
  } catch (error) {
    return { success: false, message: `Validation error: ${error}` };
  }
}

async function testGoogleAnalytics(propertyId: string, clientEmail: string, privateKey: string) {
  try {
    // Basic validation of credentials
    if (!propertyId || !clientEmail || !privateKey) {
      return { success: false, message: 'Missing required credentials' };
    }

    if (!/^\d+$/.test(propertyId)) {
      return { success: false, message: 'Property ID should be numeric' };
    }

    if (!clientEmail.includes('@')) {
      return { success: false, message: 'Invalid client email format' };
    }

    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      return { success: false, message: 'Invalid private key format' };
    }

    return { success: true, message: 'Google Analytics credentials appear valid' };
  } catch (error) {
    return { success: false, message: `Validation error: ${error}` };
  }
}

async function testOpenRouter(apiKey: string, model: string) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      const models = await response.json();
      const modelExists = models.data?.some((m: any) => m.id === model);
      
      if (modelExists) {
        return { success: true, message: `Model "${model}" is available` };
      } else {
        return { success: false, message: `Model "${model}" not found in available models` };
      }
    } else {
      return { success: false, message: `API error: ${response.statusText}` };
    }
  } catch (error) {
    return { success: false, message: `Connection error: ${error}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { service, credentials } = await request.json();

    let result;
    switch (service) {
      case 'wordpress':
        result = await testWordPress(
          credentials.NEXT_PUBLIC_WORDPRESS_URL,
          credentials.WORDPRESS_USERNAME,
          credentials.WORDPRESS_APP_PASSWORD
        );
        break;
      
      case 'gsc':
        result = await testGoogleSearchConsole(
          credentials.GSC_SITE_URL,
          credentials.GSC_CLIENT_EMAIL,
          credentials.GSC_PRIVATE_KEY
        );
        break;
      
      case 'ga4':
        result = await testGoogleAnalytics(
          credentials.GA4_PROPERTY_ID,
          credentials.GA4_CLIENT_EMAIL,
          credentials.GA4_PRIVATE_KEY
        );
        break;
      
      case 'openrouter':
        result = await testOpenRouter(
          credentials.OPENROUTER_API_KEY,
          credentials.OPENROUTER_MODEL
        );
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown service' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `Test failed: ${error}` },
      { status: 500 }
    );
  }
}