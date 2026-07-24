import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    starterPriceId: process.env.STRIPE_STARTER_PRICE_ID,
    proPriceId: process.env.STRIPE_PRO_PRICE_ID,
    enterprisePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  },
  
  zoom: {
    clientId: process.env.ZOOM_CLIENT_ID,
    clientSecret: process.env.ZOOM_CLIENT_SECRET,
    redirectUri: process.env.ZOOM_REDIRECT_URI || `${process.env.CLIENT_URL || 'http://localhost:3000'}/api/zoom/oauth/callback`,
    webhookSecretToken: process.env.ZOOM_WEBHOOK_SECRET_TOKEN,
  },
  
  ai: {
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.1-pro',
  },
  
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || 'DealForge <noreply@dealforge.app>',
  },
  
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

if (config.isProd) {
  const required = [
    ['CLIENT_URL', config.clientUrl],
    ['ZOOM_CLIENT_ID', config.zoom.clientId],
    ['ZOOM_CLIENT_SECRET', config.zoom.clientSecret],
    ['RESEND_API_KEY', config.email.resendApiKey]
  ];
  const missing = required.filter(([, val]) => !val);
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.map(([k]) => k).join(', ')}`);
    process.exit(1);
  }
}
