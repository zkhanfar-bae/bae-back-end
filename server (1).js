require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

const AUTH_TOKEN = process.env.AUTH_TOKEN;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PayTest backend is running' });
});

// Step 1: Get capture context from bank
app.post('/api/capture-context', async (req, res) => {
  const { amount, currency, targetOrigin } = req.body;

  try {
    const bankResponse = await fetch(
      'https://merchant-order-token.bankaletihad.com/v1/payments/app2/capture-context',
      {
        method: 'POST',
        headers: {
          'Authorization': AUTH_TOKEN,
          'Content-Type':  'application/json',
          'Accept':        'application/json',
          'User-Agent':    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: JSON.stringify({
          targetOrigins: [targetOrigin],
          totalAmount:   String(amount),
          currency:      currency || 'JOD',
        }),
      }
    );

    const data = await bankResponse.json();
    console.log('[Backend] Capture context status:', bankResponse.status);
    console.log('[Backend] Capture context response:', JSON.stringify(data));

    res.status(bankResponse.status).json(data);

  } catch (err) {
    console.error('[Backend] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Step 2: Finalize payment
app.post('/api/finalize-payment', async (req, res) => {
  const { transientToken } = req.body;

  try {
    const bankResponse = await fetch(
      'https://api.apps-console.bankaletihad.com/BAF3E974-52AA-7598-FF04-56945EF93500/045FCC75-62A0-EE53-FF87-4FD683745500/services/businessMarketplace/pay/hostedCheckout',
      {
        method: 'POST',
        headers: {
          'Authorization': AUTH_TOKEN,
          'Content-Type':  'application/json',
          'Accept':        'application/json',
          'User-Agent':    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: JSON.stringify({ token: transientToken }),
      }
    );

    const data = await bankResponse.json();
    console.log('[Backend] Finalize status:', bankResponse.status);
    console.log('[Backend] Finalize response:', JSON.stringify(data));

    res.status(bankResponse.status).json(data);

  } catch (err) {
    console.error('[Backend] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Backend] Running on port ${PORT}`);
});
