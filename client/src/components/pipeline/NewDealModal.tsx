import { X } from 'lucide-react';
import React, { useState } from 'react';
import './Pipeline.css';
import { STAGES } from './PipelineCard';

export interface DealFormData {
  title: string;
  stage: string;
  value: string;
  probability: string;
  expectedClose: string;
}

interface NewDealModalProps {
  onClose: () => void;
  onSubmit: (data: DealFormData) => void;
}

const initialForm: DealFormData = {
  title: '',
  stage: 'lead_identified',
  value: '',
  probability: '',
  expectedClose: '',
};

export const NewDealModal: React.FC<NewDealModalProps> = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState<DealFormData>(initialForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">New Deal</div>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Deal Title</label>
              <input
                className="form-input"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Enterprise License Deal"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stage</label>
              <div style={{ position: 'relative' }}>
                <select
                  className="form-select"
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value })}
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Deal Value ($)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="100"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Probability (%)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="100"
                  value={form.probability}
                  onChange={(e) => setForm({ ...form, probability: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Expected Close Date</label>
              <input
                className="form-input"
                type="date"
                value={form.expectedClose}
                onChange={(e) => setForm({ ...form, expectedClose: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
