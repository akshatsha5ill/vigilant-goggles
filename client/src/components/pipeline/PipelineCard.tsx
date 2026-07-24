import React from 'react';
import { GripVertical, DollarSign, Percent, Calendar, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import './Pipeline.css';

export const STAGES = [
  { id: 'lead_identified', label: 'Lead Identified', color: 'var(--accent-primary)' },
  { id: 'qualified', label: 'Qualified', color: '#6366f1' },
  { id: 'proposal', label: 'Proposal', color: 'var(--warning)' },
  { id: 'negotiation', label: 'Negotiation', color: '#f97316' },
  { id: 'closed_won', label: 'Closed Won', color: 'var(--success)' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'var(--danger)' },
];

export function formatCurrency(val: number) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

export function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface PipelineCardProps {
  deal: any;
  isDragged: boolean;
  onDragStart: (e: React.DragEvent, dealId: string) => void;
  onDragEnd: () => void;
  onMove: (dealId: string, direction: 'forward' | 'backward') => void;
  onDelete: (dealId: string) => void;
}

export const PipelineCard: React.FC<PipelineCardProps> = ({
  deal,
  isDragged,
  onDragStart,
  onDragEnd,
  onMove,
  onDelete,
}) => {
  const stageIds = STAGES.map((s) => s.id);
  const currentIdx = stageIds.indexOf(deal.stage);
  const canGoBack = currentIdx > 0;
  const canGoForward = currentIdx < stageIds.length - 1;

  return (
    <div
      className={`pipeline-card ${isDragged ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      onDragEnd={onDragEnd}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <GripVertical size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <div className="card-title">{deal.title}</div>
      </div>
      <div className="card-row">
        <DollarSign size={12} style={{ color: 'var(--success)' }} />
        <span className="card-value">{formatCurrency(deal.value || 0)}</span>
      </div>
      <div className="card-row">
        <Percent size={12} style={{ color: 'var(--text-muted)' }} />
        <span>{deal.probability || 0}% probability</span>
      </div>
      <div className="card-row">
        <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
        <span>{formatDate(deal.expectedClose)}</span>
      </div>
      <div className="card-actions">
        <div className="move-btn-group">
          <button
            className="action-btn"
            style={{
              opacity: canGoBack ? 1 : 0.3,
              pointerEvents: canGoBack ? 'auto' : 'none',
            }}
            onClick={() => onMove(deal.id, 'backward')}
            title={`Move backward`}
          >
            <ArrowLeft size={12} />
          </button>
          <button
            className="action-btn"
            style={{
              opacity: canGoForward ? 1 : 0.3,
              pointerEvents: canGoForward ? 'auto' : 'none',
            }}
            onClick={() => onMove(deal.id, 'forward')}
            title={`Move forward`}
          >
            <ArrowRight size={12} />
          </button>
        </div>
        <button
          className="action-btn danger"
          onClick={() => onDelete(deal.id)}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};
