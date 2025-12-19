const express = require('express');
const { MercadoPagoConfig, PreApproval } = require('mercadopago');

const app = express();
app.use(express.json());

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const preApproval = new PreApproval(client);

// Health check
app.get('/', (req, res) => {
  res.send('Backend VetAgro AI ativo 🚀');
});

// Criar assinatura recorrente
app.post('/criar-assinatura', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const subscription = await preApproval.create({
      body: {
        reason: 'Assinatura VetAgro AI Pro',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 49.90,
          currency_id: 'BRL'
        },
        payer_email: email,
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
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({
      error: 'Erro ao criar assinatura',
      details: error.message
    });
  }
});

module.exports = app;
