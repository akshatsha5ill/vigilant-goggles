import React from 'react';
import { Play, Pause, Trash2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { DripCampaign } from '../../types';
import './Email.css';

interface DripCampaignCardProps {
  campaign: DripCampaign;
  getLeadName: (id: string) => string;
  handleToggleStatus: (id: string, currentStatus: string) => void;
  handleDelete: (id: string) => void;
}

export const DripCampaignCard: React.FC<DripCampaignCardProps> = ({
  campaign,
  getLeadName,
  handleToggleStatus,
  handleDelete
}) => {
  const getStatusDisplay = () => {
    switch (campaign.status) {
      case 'active':
        return { color: 'var(--success)', icon: Play, text: 'Active' };
      case 'paused':
        return { color: 'var(--warning)', icon: Pause, text: 'Paused' };
      case 'completed':
        return { color: 'var(--text-muted)', icon: CheckCircle, text: 'Completed' };
      case 'error':
        return { color: 'var(--danger)', icon: AlertCircle, text: 'Error' };
      default:
        return { color: 'var(--text-muted)', icon: Clock, text: campaign.status };
    }
  };

  const statusInfo = getStatusDisplay();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="glass-card campaign-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {campaign.name}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            To: <span style={{ color: 'var(--text-primary)' }}>{getLeadName(campaign.leadId)}</span>
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          padding: '4px 10px', 
          borderRadius: '20px', 
          backgroundColor: 'var(--bg-tertiary)',
          border: `1px solid ${statusInfo.color}30`
        }}>
          <StatusIcon size={14} style={{ color: statusInfo.color }} />
          <span style={{ fontSize: '12px', fontWeight: 500, color: statusInfo.color }}>{statusInfo.text}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1, backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step Progress</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{campaign.currentStep}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>/ 3</span>
          </div>
          <div style={{ marginTop: '8px', height: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              backgroundColor: 'var(--accent-primary)', 
              width: `${(campaign.currentStep / 3) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        <div style={{ flex: 1, backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Run</p>
          <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
            {campaign.status === 'completed' ? 'Finished' : campaign.nextRunAt ? new Date(campaign.nextRunAt).toLocaleString() : '—'}
          </p>
          {campaign.error && (
             <p style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>
               {campaign.error}
             </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: 'auto' }}>
        {campaign.status !== 'completed' && (
          <button
            onClick={() => handleToggleStatus(campaign.id, campaign.status)}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            {campaign.status === 'active' ? (
              <><Pause size={14} /> Pause</>
            ) : (
              <><Play size={14} /> Resume</>
            )}
          </button>
        )}
        <button
          onClick={() => handleDelete(campaign.id)}
          className="btn-secondary"
          style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--danger)' }}
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
};
