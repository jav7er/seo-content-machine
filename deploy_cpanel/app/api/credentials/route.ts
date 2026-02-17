import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    const credentials: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          credentials[key] = valueParts.join('=').replace(/^"|"$/g, '');
        }
      }
    });

    return NextResponse.json({ success: true, credentials });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error reading .env file' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { credentials } = await request.json();
    
    const envPath = path.join(process.cwd(), '.env');
    
    let envContent = '';
    Object.entries(credentials).forEach(([key, value]) => {
      if (typeof value === 'string' && (value.includes('\n') || value.includes(' '))) {
        envContent += `${key}="${value}"\n`;
      } else {
        envContent += `${key}=${value}\n`;
      }
    });

    fs.writeFileSync(envPath, envContent);

    return NextResponse.json({ success: true, message: 'Credentials updated successfully' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error updating .env file' },
      { status: 500 }
    );
  }
}