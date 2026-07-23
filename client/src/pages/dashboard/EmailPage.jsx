import { useState, useEffect, useCallback } from 'react';
import { Send, Sparkles, Mail, Clock, CheckCircle, FileText, Plus, X, Filter, Search, Trash2, RefreshCw } from 'lucide-react';
import { db } from '../../services/local-db/db';
import { useStore } from '../../store';

const STATUS_CONFIG = {
  draft: { color: 'var(--text-muted)', bg: 'var(--bg-tertiary)', icon: FileText, label: 'Draft' },
  scheduled: { color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.12)', icon: Clock, label: 'Scheduled' },
  sent: { color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.12)', icon: CheckCircle, label: 'Sent' },
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
};

const textareaStyle = {
  ...inputStyle,
  minHeight: '180px',
  resize: 'vertical',
  lineHeight: 1.6,
};

const btnPrimary = {
  padding: '10px 18px',
  backgroundColor: 'var(--accent-primary)',
  color: 'var(--bg-primary)',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'opacity 0.2s',
};

const btnSecondary = {
  padding: '10px 18px',
  backgroundColor: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'opacity 0.2s',
};

const btnDanger = {
  padding: '6px 10px',
  backgroundColor: 'transparent',
  color: 'var(--danger)',
  border: '1px solid var(--danger)',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  transition: 'opacity 0.2s',
};

export default function EmailPage() {
  const { openAiKey } = useStore();
  const [campaigns, setCampaigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  const [form, setForm] = useState({
    leadId: '',
    subject: '',
    body: '',
    type: 'follow_up',
  });

  const [stats, setStats] = useState({ total: 0, sent: 0, draft: 0, scheduled: 0 });

  const loadData = useCallback(async () => {
    try {
      const [campaignData, leadData, trackingData] = await Promise.all([
        db.email_campaigns.toArray(),
        db.leads.toArray(),
        db.email_tracking.toArray(),
      ]);

      setCampaigns(campaignData.sort((a, b) => {
        const da = a.sentAt || a.scheduledAt || a.createdAt || 0;
        const db2 = b.sentAt || b.scheduledAt || b.createdAt || 0;
        return db2 - da;
      }));
      setLeads(leadData);

      const sentCount = campaignData.filter(c => c.status === 'sent').length;
      const draftCount = campaignData.filter(c => c.status === 'draft').length;
      const scheduledCount = campaignData.filter(c => c.status === 'scheduled').length;

      let opened = 0;
      let replied = 0;
      for (const t of trackingData) {
        if (t.opens > 0) opened++;
        if (t.replied > 0) replied++;
      }

      setStats({
        total: campaignData.length,
        sent: sentCount,
        draft: draftCount,
        scheduled: scheduledCount,
        opened,
        replied,
      });
    } catch (err) {
      console.error('Failed to load email data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getLeadName = (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.name : 'Unknown Lead';
  };

  const getLeadEmail = (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.email : '';
  };

  const getLeadCompany = (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.company : '';
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const leadName = getLeadName(c.leadId).toLowerCase();
    const subject = (c.subject || '').toLowerCase();
    const matchesSearch = leadName.includes(search.toLowerCase()) || subject.includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleAiDraft = async () => {
    if (!form.leadId) return;
    setAiLoading(true);
    try {
      const lead = leads.find(l => l.id === form.leadId);
      let transcriptContext = '';
      try {
        const transcripts = await db.transcripts.toArray();
        const leadMeetings = await db.meetings.toArray();
        const meetingForLead = leadMeetings.find(m =>
          transcripts.some(t => t.meetingId === m.id)
        );
        if (meetingForLead) {
          const transcript = transcripts.find(t => t.meetingId === meetingForLead.id);
          transcriptContext = transcript?.content || transcript?.text || '';
        }
      } catch {}

      const res = await fetch('/api/email/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: {
            name: lead?.name,
            email: lead?.email,
            company: lead?.company,
            role: lead?.role,
            score: lead?.score,
          },
          transcriptContext: transcriptContext.slice(0, 4000),
          previousEmails: campaigns
            .filter(c => c.leadId === form.leadId)
            .map(c => ({ subject: c.subject, body: c.body, sentAt: c.sentAt })),
          apiKey: openAiKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({
          ...prev,
          subject: data.subject || prev.subject,
          body: data.body || data.content || prev.body,
        }));
      }
    } catch (err) {
      console.error('AI draft failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!form.leadId || !form.subject) return;
    const campaign = {
      id: crypto.randomUUID(),
      leadId: form.leadId,
      subject: form.subject,
      body: form.body,
      status: 'draft',
      type: form.type,
      createdAt: Date.now(),
    };
    await db.email_campaigns.put(campaign);
    setForm({ leadId: '', subject: '', body: '', type: 'follow_up' });
    setShowCompose(false);
    loadData();
  };

  const handleSend = async () => {
    if (!form.leadId || !form.subject || !form.body) return;
    setSendLoading(true);
    try {
      const lead = leads.find(l => l.id === form.leadId);
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead?.email,
          subject: form.subject,
          body: form.body,
          leadId: form.leadId,
        }),
      });

      const campaign = {
        id: crypto.randomUUID(),
        leadId: form.leadId,
        subject: form.subject,
        body: form.body,
        status: 'sent',
        type: form.type,
        sentAt: Date.now(),
        createdAt: Date.now(),
      };
      await db.email_campaigns.put(campaign);

      if (res.ok) {
        await db.email_tracking.put({
          id: crypto.randomUUID(),
          campaignId: campaign.id,
          opens: 0,
          clicks: 0,
          replied: 0,
          lastActivity: null,
        });
      }

      setForm({ leadId: '', subject: '', body: '', type: 'follow_up' });
      setShowCompose(false);
      loadData();
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSendLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await db.email_campaigns.delete(id);
    loadData();
  };

  const handleSendDraft = async (campaign) => {
    const lead = leads.find(l => l.id === campaign.leadId);
    if (!lead) return;
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.email,
          subject: campaign.subject,
          body: campaign.body,
          leadId: campaign.leadId,
        }),
      });

      await db.email_campaigns.put({
        ...campaign,
        status: 'sent',
        sentAt: Date.now(),
      });

      if (res.ok) {
        await db.email_tracking.put({
          id: crypto.randomUUID(),
          campaignId: campaign.id,
          opens: 0,
          clicks: 0,
          replied: 0,
          lastActivity: null,
        });
      }

      loadData();
    } catch (err) {
      console.error('Send draft failed:', err);
    }
  };

  const statCards = [
    { label: 'Total Campaigns', value: stats.total, icon: Mail, color: 'var(--accent-primary)' },
    { label: 'Emails Sent', value: stats.sent, icon: Send, color: 'var(--success)' },
    { label: 'Drafts', value: stats.draft, icon: FileText, color: 'var(--text-muted)' },
    { label: 'Scheduled', value: stats.scheduled, icon: Clock, color: 'var(--warning)' },
  ];

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} style={{ marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
        <p>Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>Email Outreach</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Manage AI-generated follow-ups and campaigns.</p>
        </div>
        <button onClick={() => setShowCompose(!showCompose)} style={{ ...btnPrimary, opacity: showCompose ? 0.7 : 1 }}>
          {showCompose ? <><X size={16} /> Close</> : <><Plus size={16} /> Compose</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card stat-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>{label}</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <div className="data-text" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
          </div>
        ))}
      </div>

      {stats.sent > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={16} style={{ color: 'var(--success)' }} />
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Opened</span>
            </div>
            <div className="data-text" style={{ fontSize: '24px', fontWeight: 700 }}>{stats.opened || 0}</div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {stats.sent > 0 ? Math.round(((stats.opened || 0) / stats.sent) * 100) : 0}% open rate
            </p>
          </div>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={16} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Replied</span>
            </div>
            <div className="data-text" style={{ fontSize: '24px', fontWeight: 700 }}>{stats.replied || 0}</div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {stats.sent > 0 ? Math.round(((stats.replied || 0) / stats.sent) * 100) : 0}% reply rate
            </p>
          </div>
        </div>
      )}

      {showCompose && (
        <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent-primary)' }}>Compose Email</h2>
            {openAiKey && (
              <button onClick={handleAiDraft} disabled={!form.leadId || aiLoading} style={{ ...btnSecondary, opacity: form.leadId && !aiLoading ? 1 : 0.5 }}>
                <Sparkles size={14} />
                {aiLoading ? 'Generating...' : 'AI Draft'}
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px', color: 'var(--text-secondary)' }}>Lead</label>
              <select
                value={form.leadId}
                onChange={(e) => setForm(prev => ({ ...prev, leadId: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
              >
                <option value="">Select a lead...</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>{l.name} — {l.company || l.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px', color: 'var(--text-secondary)' }}>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
              >
                <option value="follow_up">Follow Up</option>
                <option value="cold_outreach">Cold Outreach</option>
                <option value="proposal">Proposal</option>
                <option value="thank_you">Thank You</option>
                <option value="check_in">Check In</option>
              </select>
            </div>
          </div>

          {form.leadId && (
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{getLeadName(form.leadId)}</span>
              <span style={{ margin: '0 8px', opacity: 0.5 }}>·</span>
              <span>{getLeadEmail(form.leadId)}</span>
              <span style={{ margin: '0 8px', opacity: 0.5 }}>·</span>
              <span>{getLeadCompany(form.leadId)}</span>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px', color: 'var(--text-secondary)' }}>Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Email subject line..."
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px', color: 'var(--text-secondary)' }}>Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Write your email content..."
              style={textareaStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={handleSaveDraft} disabled={!form.leadId || !form.subject} style={{ ...btnSecondary, opacity: form.leadId && form.subject ? 1 : 0.5 }}>
              <FileText size={14} />
              Save Draft
            </button>
            <button onClick={handleSend} disabled={!form.leadId || !form.subject || !form.body || sendLoading} style={{ ...btnPrimary, opacity: form.leadId && form.subject && form.body && !sendLoading ? 1 : 0.5 }}>
              <Send size={14} />
              {sendLoading ? 'Sending...' : 'Send Now'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', flex: 1, minWidth: '280px' }}>
          {['all', 'draft', 'scheduled', 'sent'].map(s => {
            const count = s === 'all' ? campaigns.length : campaigns.filter(c => c.status === s).length;
            return (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: filterStatus === s ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: filterStatus === s ? 'var(--bg-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s', textTransform: 'capitalize' }}>
                {s === 'all' ? 'All' : s} ({count})
              </button>
            );
          })}
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '8px 12px 8px 32px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', width: '220px' }}
          />
        </div>
      </div>

      {filteredCampaigns.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Mail size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
          <p style={{ fontSize: '16px', marginBottom: '4px' }}>{campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match your filters'}</p>
          <p style={{ fontSize: '13px' }}>{campaigns.length === 0 ? 'Click "Compose" to create your first email campaign.' : 'Try adjusting your search or filters.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filteredCampaigns.map(campaign => {
            const status = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
            const StatusIcon = status.icon;
            return (
              <div key={campaign.id} className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'background-color 0.2s' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: status.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <StatusIcon size={18} style={{ color: status.color }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{campaign.subject || 'Untitled'}</h4>
                    <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 500, backgroundColor: status.bg, color: status.color, textTransform: 'capitalize', flexShrink: 0 }}>
                      {status.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>To: <strong style={{ color: 'var(--text-secondary)' }}>{getLeadName(campaign.leadId)}</strong></span>
                    <span>{getLeadEmail(campaign.leadId)}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {campaign.sentAt
                      ? new Date(campaign.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : campaign.scheduledAt
                        ? `Scheduled: ${new Date(campaign.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : campaign.createdAt
                          ? new Date(campaign.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '—'}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    {campaign.status === 'draft' && (
                      <>
                        <button onClick={() => handleSendDraft(campaign)} style={{ padding: '5px 10px', backgroundColor: 'var(--success)', color: 'var(--bg-primary)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Send size={12} /> Send
                        </button>
                        <button onClick={() => handleDelete(campaign.id)} style={btnDanger}>
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
