import React from 'react';
import { Send, Sparkles, FileText } from 'lucide-react';
import './Email.css';

interface ComposeEmailProps {
  form: { leadId: string; subject: string; body: string; type: string };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  leads: any[];
  getLeadName: (id: string) => string;
  getLeadEmail: (id: string) => string;
  getLeadCompany: (id: string) => string;
  openAiKey: string | null;
  aiLoading: boolean;
  sendLoading: boolean;
  handleAiDraft: () => void;
  handleSaveDraft: () => void;
  handleSend: () => void;
}

export const ComposeEmailCard: React.FC<ComposeEmailProps> = ({
  form,
  setForm,
  leads,
  getLeadName,
  getLeadEmail,
  getLeadCompany,
  openAiKey,
  aiLoading,
  sendLoading,
  handleAiDraft,
  handleSaveDraft,
  handleSend,
}) => {
  return (
    <div className="glass-card compose-card">
      <div className="compose-header">
        <h2 className="compose-title">Compose Email</h2>
        {openAiKey && (
          <button
            onClick={handleAiDraft}
            disabled={!form.leadId || aiLoading}
            className="btn-secondary"
            style={{ opacity: form.leadId && !aiLoading ? 1 : 0.5 }}
          >
            <Sparkles size={14} />
            {aiLoading ? 'Generating...' : 'AI Draft'}
          </button>
        )}
      </div>

      <div className="form-grid">
        <div>
          <label className="form-label">Lead</label>
          <select
            value={form.leadId}
            onChange={(e) => setForm((prev: any) => ({ ...prev, leadId: e.target.value }))}
            className="input-style"
            style={{ cursor: 'pointer', appearance: 'none' }}
          >
            <option value="">Select a lead...</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} — {l.company || l.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm((prev: any) => ({ ...prev, type: e.target.value }))}
            className="input-style"
            style={{ cursor: 'pointer', appearance: 'none' }}
          >
            <option value="follow_up">Follow Up</option>
            <option value="cold_outreach">Cold Outreach</option>
            <option value="proposal">Proposal</option>
            <option value="thank_you">Thank You</option>
            <option value="check_in">Check In</option>
            <option value="drip_campaign">Automated Drip Campaign</option>
          </select>
        </div>
      </div>

      {form.leadId && (
        <div className="lead-info-bar">
          <span className="lead-info-name">{getLeadName(form.leadId)}</span>
          <span className="lead-info-dot">·</span>
          <span>{getLeadEmail(form.leadId)}</span>
          <span className="lead-info-dot">·</span>
          <span>{getLeadCompany(form.leadId)}</span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Subject</label>
        <input
          type="text"
          value={form.subject}
          onChange={(e) => setForm((prev: any) => ({ ...prev, subject: e.target.value }))}
          placeholder="Email subject line..."
          className="input-style"
        />
      </div>

      {form.type !== 'drip_campaign' && (
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label">Body</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((prev: any) => ({ ...prev, body: e.target.value }))}
            placeholder="Write your email content..."
            className="textarea-style"
          />
        </div>
      )}

      <div className="compose-footer">
        <button
          onClick={handleSaveDraft}
          disabled={!form.leadId || !form.subject}
          className="btn-secondary"
          style={{ opacity: form.leadId && form.subject ? 1 : 0.5 }}
        >
          <FileText size={14} />
          Save Draft
        </button>
        <button
          onClick={handleSend}
          disabled={!form.leadId || !form.subject || (form.type !== 'drip_campaign' && !form.body) || sendLoading}
          className="btn-primary"
          style={{
            opacity: form.leadId && form.subject && (form.type === 'drip_campaign' || form.body) && !sendLoading ? 1 : 0.5,
          }}
        >
          <Send size={14} />
          {sendLoading ? 'Sending...' : form.type === 'drip_campaign' ? 'Start Campaign' : 'Send Now'}
        </button>
      </div>
    </div>
  );
};
