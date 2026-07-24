import express from 'express';
import Stripe from 'stripe';
import { verifyAuth } from '../middleware/auth.js';
import { config } from '../config.js';
import { z } from 'zod';
import { validateRequest } from 'zod-express-middleware';
import { AppError } from '../middleware/errorHandler.js';
import log from '../utils/logger.js';

const router = express.Router();
const stripe = new Stripe(config.stripe.secretKey || '');

const PLANS = {
  starter: { priceId: config.stripe.starterPriceId, name: 'Starter', meetingsLimit: 50 },
  pro: { priceId: config.stripe.proPriceId, name: 'Pro', meetingsLimit: 500 },
  enterprise: { priceId: config.stripe.enterprisePriceId, name: 'Enterprise', meetingsLimit: -1 },
};

const checkoutSchema = z.object({
  plan: z.string().min(1)
});

router.post('/create-checkout-session', verifyAuth, validateRequest({ body: checkoutSchema }), async (req: any, res: express.Response, next: express.NextFunction) => {
  try {
    const { plan } = req.body;
    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      throw new AppError('Invalid plan. Choose: starter, pro, or enterprise.', 400);
    }
    if (!config.stripe.secretKey) {
      throw new AppError('Billing is not configured.', 503);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: `${config.clientUrl}/settings?billing=success`,
      cancel_url: `${config.clientUrl}/settings?billing=cancelled`,
      metadata: { userId: req.user.uid, plan },
    });

    res.status(200).json({ status: 'success', url: session.url });
  } catch (error) {
    next(error);
  }
});

router.post('/create-portal-session', verifyAuth, async (req: any, res: express.Response, next: express.NextFunction) => {
  try {
    if (!config.stripe.secretKey) {
      throw new AppError('Billing is not configured.', 503);
    }

    const session = await stripe.billingPortal.sessions.create({
      return_url: `${config.clientUrl}/settings`,
    });

    res.status(200).json({ status: 'success', url: session.url });
  } catch (error) {
    next(error);
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = config.stripe.webhookSecret;

  if (!endpointSecret) {
    return res.status(500).json({ error: 'Stripe webhook secret not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, plan } = (session as any).metadata;
    log.info(`Subscription activated`, { userId, plan });
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    log.info(`Subscription cancelled`, { subscriptionId: (subscription as any).id });
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

export default router;
