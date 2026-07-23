const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { verifyAuth } = require('../middleware/auth');

const PLANS = {
  starter: { priceId: process.env.STRIPE_STARTER_PRICE_ID, name: 'Starter', meetingsLimit: 50 },
  pro: { priceId: process.env.STRIPE_PRO_PRICE_ID, name: 'Pro', meetingsLimit: 500 },
  enterprise: { priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID, name: 'Enterprise', meetingsLimit: -1 },
};

router.post('/create-checkout-session', verifyAuth, async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan. Choose: starter, pro, or enterprise.' });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Billing is not configured.' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?billing=success`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?billing=cancelled`,
      metadata: { userId: req.user.uid, plan },
    });

    res.status(200).json({ status: 'success', url: session.url });
  } catch (error) {
    next(error);
  }
});

router.post('/create-portal-session', verifyAuth, async (req, res, next) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Billing is not configured.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings`,
    });

    res.status(200).json({ status: 'success', url: session.url });
  } catch (error) {
    next(error);
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    return res.status(500).json({ error: 'Stripe webhook secret not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, plan } = session.metadata;
    console.log(`Subscription activated for user ${userId}: ${plan}`);
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    console.log(`Subscription cancelled: ${subscription.id}`);
  }

  res.status(200).json({ received: true });
});

router.get('/plans', (req, res) => {
  const plans = Object.entries(PLANS).map(([key, val]) => ({
    id: key,
    name: val.name,
    meetingsLimit: val.meetingsLimit,
    available: !!val.priceId,
  }));
  res.status(200).json({ status: 'success', plans });
});

module.exports = router;
