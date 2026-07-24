export default function TermsOfService() {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px', color: 'var(--accent-primary)' }}>Terms of Service</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Last updated: {new Date().toLocaleDateString()}</p>
      
      <h2 style={{ marginTop: '30px', fontSize: '24px' }}>1. Acceptance of Terms</h2>
      <p>By installing and using DealForge, you agree to these Terms of Service. If you do not agree, do not use the app.</p>
      
      <h2 style={{ marginTop: '30px', fontSize: '24px' }}>2. User Responsibilities</h2>
      <p>You are responsible for obtaining explicit consent from meeting participants before recording or transcribing meetings via the Zoom app. DealForge is not liable for any privacy violations committed by users.</p>
      
      <h2 style={{ marginTop: '30px', fontSize: '24px' }}>3. Disclaimer of Warranties</h2>
      <p>The application is provided "as is". We do not guarantee that the AI summaries, action items, or lead scoring will be entirely accurate. Users must review AI-generated content before acting upon it.</p>
      
      <h2 style={{ marginTop: '30px', fontSize: '24px' }}>4. Subscription and Billing</h2>
      <p>Subscriptions are billed in advance on a monthly basis and are non-refundable. You can cancel your subscription at any time.</p>
    </div>
  );
}
