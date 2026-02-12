This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Configuración de Credenciales

El proyecto requiere las siguientes variables de entorno en el archivo `.env`:

### WordPress API
- `NEXT_PUBLIC_WORDPRESS_URL`: URL de la API REST de WordPress
- `WORDPRESS_USERNAME`: Nombre de usuario para autenticación
- `WORDPRESS_APP_PASSWORD`: Contraseña de aplicación para WordPress

### Google Search Console
- `GSC_SITE_URL`: URL del sitio en GSC (formato: sc-domain:dominio.com)
- `GSC_CLIENT_EMAIL`: Email del service account de Google
- `GSC_PRIVATE_KEY`: Clave privada del service account

### Google Analytics 4
- `GA4_PROPERTY_ID`: ID de propiedad de GA4
- `GA4_CLIENT_EMAIL`: Email del service account para GA4
- `GA4_PRIVATE_KEY`: Clave privada del service account para GA4

### OpenRouter API
- `OPENROUTER_API_KEY`: Clave API para OpenRouter
- `OPENROUTER_MODEL`: Modelo a utilizar (actualmente: google/gemini-2.0-flash-001)
