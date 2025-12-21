const express = require('express');
const { MercadoPagoConfig, PreApproval } = require('mercadopago');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

// CORS headers for security
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

// CORS preflight handler
app.options('*', (req, res) => {
  res.set(corsHeaders);
  res.status(204).send();
});

// Apply CORS headers to all responses
app.use((req, res, next) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.set(key, value);
  });
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
      console.error('Missing Supabase configuration');
      return { error: 'Server configuration error', user: null };
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseKey
      }
    });

    if (!response.ok) {
      console.warn('Token verification failed:', response.status);
      return { error: 'Invalid or expired token', user: null };
    }

    const user = await response.json();
    return { error: null, user };
  } catch (err) {
    console.error('Token verification error:', err.message);
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
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  try {
    // Step 1: Verify authentication
    const { error: authError, user } = await verifySupabaseToken(req.headers.authorization);
    
    if (authError || !user) {
      console.warn(`[${requestId}] Auth failed from IP ${clientIp}: ${authError}`);
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const { email } = req.body;

    // Step 2: Validate email format
    if (!validateEmail(email)) {
      console.warn(`[${requestId}] Invalid email format from user ${user.id}`);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Step 3: Verify email ownership - user can only subscribe with their own email
    if (user.email?.toLowerCase() !== sanitizedEmail) {
      console.warn(`[${requestId}] Email mismatch: user ${user.id} (${user.email}) tried to use ${sanitizedEmail}`);
      return res.status(403).json({ error: 'You can only create a subscription for your own email address' });
    }

    console.log(`[${requestId}] Creating subscription for user ${user.id} (${sanitizedEmail}) from IP ${clientIp}`);

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

    console.log(`[${requestId}] Subscription created successfully: ${subscription.id}`);

    res.json({
      success: true,
      init_point: subscription.init_point,
      id: subscription.id
    });
  } catch (error) {
    console.error(`[${requestId}] Subscription creation error:`, error.message);
    res.status(500).json({
      error: 'Failed to create subscription. Please try again later.'
    });
  }
});

module.exports = app;
