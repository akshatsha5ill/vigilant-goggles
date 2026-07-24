import React from 'react';
import { Send, Trash2 } from 'lucide-react';
import './Email.css';

interface EmailCampaignCardProps {
  campaign: any;
  statusConfig: any;
  getLeadName: (id: string) => string;
  getLeadEmail: (id: string) => string;
  handleSendDraft: (campaign: any) => void;
  handleDelete: (id: string) => void;
}

export const EmailCampaignCard: React.FC<EmailCampaignCardProps> = ({
  campaign,
  statusConfig,
  getLeadName,
  getLeadEmail,
  handleSendDraft,
  handleDelete,
}) => {
  const status = statusConfig[campaign.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  const dateText = campaign.sentAt
    ? new Date(campaign.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : campaign.scheduledAt
    ? `Scheduled: ${new Date(campaign.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : campaign.createdAt
    ? new Date(campaign.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  return (
    <div className="glass-card campaign-card">
      <div className="status-icon-wrapper" style={{ backgroundColor: status.bg }}>
        <StatusIcon size={18} style={{ color: status.color }} />
      </div>

      <div className="campaign-content">
        <div className="campaign-title-row">
          <h4 className="campaign-subject">{campaign.subject || 'Untitled'}</h4>
          <span
            className="campaign-badge"
            style={{ backgroundColor: status.bg, color: status.color }}
          >
            {status.label}
          </span>
        </div>
        <div className="campaign-lead-info">
          <span>
            To: <strong className="campaign-lead-name">{getLeadName(campaign.leadId)}</strong>
          </span>
          <span>{getLeadEmail(campaign.leadId)}</span>
        </div>
      </div>

      <div className="campaign-actions">
        <div className="campaign-date">{dateText}</div>
        <div className="action-btn-group">
          {campaign.status === 'draft' && (
            <>
              <button
                className="send-btn"
                onClick={() => handleSendDraft(campaign)}
              >
                <Send size={12} /> Send
              </button>
              <button
                className="btn-danger"
                style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', backgroundColor: 'transparent', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', cursor: 'pointer' }}
                onClick={() => handleDelete(campaign.id)}
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
