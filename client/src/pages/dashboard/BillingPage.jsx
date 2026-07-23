import { useState } from 'react';
import { useStore } from '../../store';
import { CreditCard, ExternalLink, Check } from 'lucide-react';

const plans = [
  { id: 'starter', name: 'Starter', price: '$29/mo', meetings: '50 meetings/mo', features: ['AI Meeting Summaries', 'Basic CRM', 'Email Tracking', '5 GB Storage'] },
  { id: 'pro', name: 'Pro', price: '$79/mo', meetings: '500 meetings/mo', features: ['Everything in Starter', 'AI Lead Scoring', 'Pipeline Management', 'Drip Campaigns', '25 GB Storage', 'Priority Support'] },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', meetings: 'Unlimited', features: ['Everything in Pro', 'Custom Integrations', 'SSO/SAML', 'Dedicated Support', 'Unlimited Storage', 'SLA'] },
];

export default function BillingPage() {
  const { user } = useStore();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);

  const handleSubscribe = async (planId) => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.accessToken}` },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.accessToken}` },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Portal failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>Billing & Subscription</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Choose a plan that fits your team's needs.</p>
      </div>

      {currentPlan && (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Current Plan: </span>
            <span style={{ fontSize: '16px', fontWeight: 600 }}>{currentPlan}</span>
          </div>
          <button onClick={handleManage} disabled={loading} style={{ padding: '8px 16px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ExternalLink size={14} /> Manage Subscription
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '1000px' }}>
        {plans.map((plan) => (
          <div key={plan.id} className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', border: plan.id === 'pro' ? '2px solid var(--accent-primary)' : '1px solid var(--border)' }}>
            {plan.id === 'pro' && <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--accent-primary)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>MOST POPULAR</span>}
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{plan.name}</h3>
            <div style={{ fontSize: '32px', fontWeight: 700, margin: '12px 0', color: 'var(--accent-primary)' }}>{plan.price}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>{plan.meetings}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '24px', flex: 1 }}>
              {plan.features.map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Check size={14} style={{ color: 'var(--success)' }} /> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => handleSubscribe(plan.id)} disabled={loading} style={{ padding: '10px 20px', backgroundColor: plan.id === 'pro' ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: plan.id === 'pro' ? 'white' : 'var(--text-primary)', border: plan.id === 'pro' ? 'none' : '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', width: '100%' }}>
              {loading ? 'Processing...' : plan.price === 'Custom' ? 'Contact Sales' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
