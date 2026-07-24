import { useState, useEffect, useCallback, useMemo } from 'react';
import { Send, Mail, Clock, CheckCircle, FileText, Plus, X, Search, RefreshCw } from 'lucide-react';
import { db } from '../../services/local-db/db';
import { useStore } from '../../store';
import { apiClient } from '../../services/api/client';
import { auth } from '../../firebase/config';
import { ComposeEmailCard } from '../../components/email/ComposeEmailCard';
import { EmailCampaignCard } from '../../components/email/EmailCampaignCard';
import { DripCampaignCard } from '../../components/email/DripCampaignCard';
import { EmailCampaign, Lead, DripCampaign } from '../../types';
import '../../components/email/Email.css';

const STATUS_CONFIG: Record<string, any> = {
  draft: { color: 'var(--text-muted)', bg: 'var(--bg-tertiary)', icon: FileText, label: 'Draft' },
  scheduled: { color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.12)', icon: Clock, label: 'Scheduled' },
  sent: { color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.12)', icon: CheckCircle, label: 'Sent' },
};

export default function EmailPage() {
  const { openAiKey } = useStore();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [dripCampaigns, setDripCampaigns] = useState<DripCampaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
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

  const [stats, setStats] = useState({ total: 0, sent: 0, draft: 0, scheduled: 0, opened: 0, replied: 0 });

  const loadData = useCallback(async () => {
    try {
      const [campaignData, dripData, leadData, trackingData] = await Promise.all([
        db.email_campaigns.toArray(),
        db.drip_campaigns.toArray(),
        db.leads.toArray(),
        db.email_tracking.toArray(),
      ]);

      setDripCampaigns(dripData.sort((a, b) => b.createdAt - a.createdAt));

      setCampaigns(campaignData.sort((a, b) => {
        const da = a.sentAt || a.scheduledAt || a.createdAt || 0;
        const db2 = b.sentAt || b.scheduledAt || b.createdAt || 0;
        return (new Date(db2).getTime()) - (new Date(da).getTime());
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

  const syncTrackingEvents = useCallback(async () => {
    try {
      if (!auth.currentUser) return;
      const res = await apiClient.get('/tracking/events');
      if (res && res.status === 'success' && res.events && res.events.length > 0) {
        let hasUpdates = false;
        for (const event of res.events) {
          const trackingData = await db.email_tracking.where('campaignId').equals(event.campaignId).first();
          if (trackingData) {
            if (event.event === 'open') trackingData.opens += 1;
            if (event.event === 'click') trackingData.clicks += 1;
            trackingData.lastActivity = event.timestamp || new Date().toISOString();
            await db.email_tracking.put(trackingData);
            hasUpdates = true;
          }
        }
        if (hasUpdates) {
          loadData();
        }
      }
    } catch (err) {
      console.error('Failed to sync tracking events:', err);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    syncTrackingEvents();
    const interval = setInterval(syncTrackingEvents, 30000);
    return () => clearInterval(interval);
  }, [syncTrackingEvents]);

  const leadMap = useMemo(() => {
    const map = new Map();
    for (const l of leads) {
      map.set(l.id, l);
    }
    return map;
  }, [leads]);

  const getLeadName = (leadId: string) => {
    const lead = leadMap.get(leadId);
    return lead ? lead.name : 'Unknown Lead';
  };

  const getLeadEmail = (leadId: string) => {
    const lead = leadMap.get(leadId);
    return lead ? lead.email : '';
  };

  const getLeadCompany = (leadId: string) => {
    const lead = leadMap.get(leadId);
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
      } catch (err) {
        console.error("Failed to load transcript context for AI draft", err);
        useStore.getState().setError("Failed to load transcript context for AI. Drafting with limited context.");
      }

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
    if (!form.leadId || !form.subject) return;
    setSendLoading(true);
    try {
      const lead = leads.find(l => l.id === form.leadId);
      
      if (form.type === 'drip_campaign') {
        const campaign = {
          id: crypto.randomUUID(),
          leadId: form.leadId,
          name: form.subject,
          status: 'active',
          currentStep: 0,
          nextRunAt: Date.now(),
          createdAt: Date.now(),
        };
        await db.drip_campaigns.put(campaign);
      } else {
        if (!form.body) return;
        const campaignId = crypto.randomUUID();
        const baseUrl = window.location.origin;
        const uid = auth.currentUser?.uid || '';
        const pixelHtml = `<img src="${baseUrl}/api/tracking/open/${campaignId}?uid=${uid}" width="1" height="1" style="display:none;" />`;
        const trackedBody = form.body + pixelHtml;

        const res = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: lead?.email,
            subject: form.subject,
            body: trackedBody,
            leadId: form.leadId,
            emailApiKey: useStore.getState().resendKey
          }),
        });

        const campaign = {
          id: campaignId,
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

  const handleDelete = async (id: string) => {
    await db.email_campaigns.delete(id);
    loadData();
  };

  const handleToggleDripStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await db.drip_campaigns.update(id, { status: newStatus });
    loadData();
  };

  const handleDeleteDrip = async (id: string) => {
    await db.drip_campaigns.delete(id);
    loadData();
  };

  const handleSendDraft = async (campaign: any) => {
    const lead = leads.find(l => l.id === campaign.leadId);
    if (!lead) return;
    try {
      const baseUrl = window.location.origin;
      const uid = auth.currentUser?.uid || '';
      // Only append if not already tracked. Simple check:
      let bodyHtml = campaign.body;
      if (!bodyHtml.includes('/api/tracking/open/')) {
        bodyHtml += `<img src="${baseUrl}/api/tracking/open/${campaign.id}?uid=${uid}" width="1" height="1" style="display:none;" />`;
      }

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.email,
          subject: campaign.subject,
          body: bodyHtml,
          leadId: campaign.leadId,
          emailApiKey: useStore.getState().resendKey
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
      <div className="email-header">
        <div>
          <h1 className="email-title">Email Outreach</h1>
          <p className="email-subtitle">Manage AI-generated follow-ups and campaigns.</p>
        </div>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="btn-primary"
          style={{ opacity: showCompose ? 0.7 : 1 }}
        >
          {showCompose ? <><X size={16} /> Close</> : <><Plus size={16} /> Compose</>}
        </button>
      </div>

      <div className="stat-grid">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card stat-card" style={{ padding: '20px' }}>
            <div className="stat-card-inner">
              <span className="stat-label">{label}</span>
              <div className="stat-icon-wrapper" style={{ backgroundColor: `${color}15` }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      {stats.sent > 0 && (
        <div className="metrics-row">
          <div className="glass-card" style={{ padding: '20px' }}>
            <div className="metric-header">
              <div className="metric-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)' }}>
                <Mail size={16} style={{ color: 'var(--success)' }} />
              </div>
              <span className="stat-label">Opened</span>
            </div>
            <div className="metric-value">{stats.opened || 0}</div>
            <p className="metric-sub">
              {stats.sent > 0 ? Math.round(((stats.opened || 0) / stats.sent) * 100) : 0}% open rate
            </p>
          </div>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div className="metric-header">
              <div className="metric-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)' }}>
                <Send size={16} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <span className="stat-label">Replied</span>
            </div>
            <div className="metric-value">{stats.replied || 0}</div>
            <p className="metric-sub">
              {stats.sent > 0 ? Math.round(((stats.replied || 0) / stats.sent) * 100) : 0}% reply rate
            </p>
          </div>
        </div>
      )}

      {showCompose && (
        <ComposeEmailCard
          form={form}
          setForm={setForm}
          leads={leads}
          getLeadName={getLeadName}
          getLeadEmail={getLeadEmail}
          getLeadCompany={getLeadCompany}
          openAiKey={openAiKey}
          aiLoading={aiLoading}
          sendLoading={sendLoading}
          handleAiDraft={handleAiDraft}
          handleSaveDraft={handleSaveDraft}
          handleSend={handleSend}
        />
      )}

      <div className="filters-row">
        <div className="filter-btn-group">
          {['all', 'draft', 'scheduled', 'sent', 'drips'].map(s => {
            let count = 0;
            if (s === 'all') count = campaigns.length;
            else if (s === 'drips') count = dripCampaigns.length;
            else count = campaigns.filter(c => c.status === s).length;
            
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`filter-btn ${filterStatus === s ? 'active' : 'inactive'}`}
              >
                {s === 'all' ? 'All' : s === 'drips' ? 'Drip Campaigns' : s} ({count})
              </button>
            );
          })}
        </div>
        <div className="search-wrapper">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {filterStatus === 'drips' ? (
        dripCampaigns.length === 0 ? (
          <div className="glass-card empty-state">
            <Clock size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p style={{ fontSize: '16px', marginBottom: '4px' }}>No drip campaigns yet</p>
            <p style={{ fontSize: '13px' }}>Click "Compose" and select "Automated Drip Campaign".</p>
          </div>
        ) : (
          <div className="campaign-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {dripCampaigns.filter(c => {
               const leadName = getLeadName(c.leadId).toLowerCase();
               const name = (c.name || '').toLowerCase();
               return leadName.includes(search.toLowerCase()) || name.includes(search.toLowerCase());
            }).map(campaign => (
              <DripCampaignCard
                key={campaign.id}
                campaign={campaign}
                getLeadName={getLeadName}
                handleToggleStatus={handleToggleDripStatus}
                handleDelete={handleDeleteDrip}
              />
            ))}
          </div>
        )
      ) : filteredCampaigns.length === 0 ? (
        <div className="glass-card empty-state">
          <Mail size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
          <p style={{ fontSize: '16px', marginBottom: '4px' }}>
            {campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match your filters'}
          </p>
          <p style={{ fontSize: '13px' }}>
            {campaigns.length === 0 ? 'Click "Compose" to create your first email campaign.' : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="campaign-list">
          {filteredCampaigns.map(campaign => (
            <EmailCampaignCard
              key={campaign.id}
              campaign={campaign}
              statusConfig={STATUS_CONFIG}
              getLeadName={getLeadName}
              getLeadEmail={getLeadEmail}
              handleSendDraft={handleSendDraft}
              handleDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
