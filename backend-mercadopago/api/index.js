const express = require('express');
const { MercadoPagoConfig, PreApproval } = require('mercadopago');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

// Allowed origins for CORS - no wildcard fallback
const ALLOWED_ORIGINS = [
  'https://vetagro.ai',
  'https://www.vetagro.ai',
  'https://vetagro-sustentavel.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

// Generate CORS headers based on request origin
const getCorsHeaders = (req) => {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];
    
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };
};

// CORS preflight handler
app.options('*', (req, res) => {
  res.set(getCorsHeaders(req));
  res.status(204).send();
});

// Apply CORS headers and origin validation to all responses
app.use((req, res, next) => {
  const corsHeaders = getCorsHeaders(req);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.set(key, value);
  });
  
  // Reject requests from non-allowed origins (except OPTIONS)
  const origin = req.headers.origin;
  if (req.method !== 'OPTIONS' && origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  
  next();
});

// Rate limiting - 5 requests per hour per IP
const subscriptionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many subscription attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const preApproval = new PreApproval(client);

// Email validation regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Validate email format
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 255) return false;
  return emailRegex.test(email.trim());
};

// Verify Supabase JWT token
const verifySupabaseToken = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', user: null };
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Call Supabase to verify the token and get user info
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return { error: 'Server configuration error', user: null };
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseKey
      }
    });

    if (!response.ok) {
      return { error: 'Invalid or expired token', user: null };
    }

    const user = await response.json();
    return { error: null, user };
  } catch (err) {
    return { error: 'Authentication failed', user: null };
  }
};

// Health check
app.get('/', (req, res) => {
  res.send('Backend VetAgro AI ativo 🚀');
});

// Criar assinatura recorrente (protected endpoint)
app.post('/criar-assinatura', subscriptionLimiter, async (req, res) => {
  const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  try {
    // Step 1: Verify authentication
    const { error: authError, user } = await verifySupabaseToken(req.headers.authorization);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const { email } = req.body;

    // Step 2: Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Step 3: Verify email ownership - user can only subscribe with their own email
    if (user.email?.toLowerCase() !== sanitizedEmail) {
      return res.status(403).json({ error: 'You can only create a subscription for your own email address' });
    }

    // Step 4: Create subscription with Mercado Pago
    const subscription = await preApproval.create({
      body: {
        reason: 'Assinatura VetAgro AI Pro',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 49.90,
          currency_id: 'BRL'
        },
        payer_email: sanitizedEmail,
        back_url: 'https://vetagro.ai/assinatura-confirmada',
        status: 'pending'
      }
    });

    res.json({
      success: true,
      init_point: subscription.init_point,
      id: subscription.id
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create subscription. Please try again later.'
    });
  }
});

module.exports = app;
