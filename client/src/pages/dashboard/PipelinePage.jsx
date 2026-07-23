import { useState, useEffect, useCallback } from 'react';
import { Plus, DollarSign, Calendar, Percent, GripVertical, X, ArrowRight, ArrowLeft, Trash2 } from 'lucide-react';
import { dealsDB } from '../../services/local-db/deals';

const STAGES = [
  { id: 'lead_identified', label: 'Lead Identified', color: 'var(--accent-primary)' },
  { id: 'qualified', label: 'Qualified', color: '#6366f1' },
  { id: 'proposal', label: 'Proposal', color: 'var(--warning)' },
  { id: 'negotiation', label: 'Negotiation', color: '#f97316' },
  { id: 'closed_won', label: 'Closed Won', color: 'var(--success)' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'var(--danger)' },
];

function formatCurrency(val) {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = {
  header: { marginBottom: '30px' },
  title: { fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px' },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  summaryCard: {
    padding: '20px',
    borderRadius: '12px',
    backgroundColor: 'var(--bg-glass)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border)',
  },
  summaryLabel: { color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, marginBottom: '8px' },
  summaryValue: { fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' },
  boardContainer: {
    display: 'flex',
    gap: '16px',
    overflowX: 'auto',
    paddingBottom: '16px',
    minHeight: '400px',
  },
  column: {
    minWidth: '280px',
    maxWidth: '320px',
    flex: '1 0 280px',
    borderRadius: '12px',
    backgroundColor: 'var(--bg-glass)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
  },
  columnHeader: {
    padding: '16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  columnTitle: { fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  columnCount: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
  },
  columnValue: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' },
  cardList: { padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '60px' },
  card: {
    padding: '14px',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    cursor: 'grab',
    transition: 'transform 0.15s, box-shadow 0.15s',
    userSelect: 'none',
  },
  cardDragging: {
    opacity: 0.5,
    transform: 'rotate(2deg)',
  },
  cardTitle: { fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' },
  cardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
  cardValue: { fontWeight: 600, color: 'var(--success)' },
  cardActions: {
    display: 'flex',
    gap: '4px',
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid var(--border)',
  },
  actionBtn: {
    padding: '4px 8px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'background-color 0.2s',
  },
  dropZone: {
    flex: 1,
    minHeight: '40px',
    borderRadius: '8px',
    border: '2px dashed var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: 'var(--text-muted)',
    transition: 'border-color 0.2s, backgroundColor 0.2s',
  },
  dropZoneActive: {
    borderColor: 'var(--accent-primary)',
    backgroundColor: 'var(--accent-primary)10',
  },
  addBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--accent-primary)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'opacity 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '480px',
    maxWidth: '90vw',
    borderRadius: '16px',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' },
  modalClose: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
  },
  modalBody: { padding: '24px' },
  formGroup: { marginBottom: '18px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  btnSecondary: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  },
  btnPrimary: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--accent-primary)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },
  emptyCol: {
    textAlign: 'center',
    padding: '20px 12px',
    color: 'var(--text-muted)',
    fontSize: '12px',
  },
  moveBtnGroup: { display: 'flex', gap: '4px' },
};

const initialForm = {
  title: '',
  stage: 'lead_identified',
  value: '',
  probability: '',
  expectedClose: '',
};

export default function PipelinePage() {
  const [deals, setDeals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const loadDeals = useCallback(async () => {
    const all = await dealsDB.getAll();
    setDeals(all);
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = deals.filter((d) => d.stage === stage.id);
    return acc;
  }, {});

  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const openValue = deals
    .filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .reduce((sum, d) => sum + (d.value || 0), 0);
  const wonValue = deals.filter((d) => d.stage === 'closed_won').reduce((sum, d) => sum + (d.value || 0), 0);
  const weightedValue = deals.reduce((sum, d) => sum + (d.value || 0) * ((d.probability || 0) / 100), 0);

  const handleDragStart = (e, dealId) => {
    setDraggedId(dealId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e, stageId) => {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData('text/plain');
    if (!dealId) return;
    const deal = deals.find((d) => d.id === dealId);
    if (deal && deal.stage !== stageId) {
      await dealsDB.put({ ...deal, stage: stageId });
      loadDeals();
    }
    setDraggedId(null);
  };

  const moveDeal = async (dealId, direction) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    const stageIds = STAGES.map((s) => s.id);
    const idx = stageIds.indexOf(deal.stage);
    const newIdx = direction === 'forward' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= stageIds.length) return;
    await dealsDB.put({ ...deal, stage: stageIds[newIdx] });
    loadDeals();
  };

  const deleteDeal = async (dealId) => {
    await dealsDB.delete(dealId);
    loadDeals();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await dealsDB.put({
      id: crypto.randomUUID(),
      leadId: '',
      title: form.title.trim(),
      stage: form.stage,
      value: parseFloat(form.value) || 0,
      probability: parseInt(form.probability) || 0,
      expectedClose: form.expectedClose || null,
      createdAt: new Date().toISOString(),
    });
    setForm(initialForm);
    setShowModal(false);
    loadDeals();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) setShowModal(false);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ ...styles.header, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={styles.title}>Pipeline</h1>
          <p style={styles.subtitle}>Track and manage your deals through each stage.</p>
        </div>
        <button
          style={styles.addBtn}
          onClick={() => setShowModal(true)}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={16} /> New Deal
        </button>
      </div>

      <div style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Total Pipeline</div>
          <div style={styles.summaryValue}>{formatCurrency(totalValue)}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Open Deals</div>
          <div style={{ ...styles.summaryValue, color: 'var(--accent-primary)' }}>{formatCurrency(openValue)}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Weighted Value</div>
          <div style={{ ...styles.summaryValue, color: 'var(--warning)' }}>{formatCurrency(weightedValue)}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Won Revenue</div>
          <div style={{ ...styles.summaryValue, color: 'var(--success)' }}>{formatCurrency(wonValue)}</div>
        </div>
      </div>

      <div style={styles.boardContainer}>
        {STAGES.map((stage) => {
          const stageDeals = dealsByStage[stage.id] || [];
          const stageTotal = stageDeals.reduce((s, d) => s + (d.value || 0), 0);
          const isOver = dragOverStage === stage.id;
          return (
            <div
              key={stage.id}
              style={{
                ...styles.column,
                borderColor: isOver ? stage.color : undefined,
              }}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div style={styles.columnHeader}>
                <div>
                  <div style={{ ...styles.columnTitle, color: stage.color }}>{stage.label}</div>
                  {stageTotal > 0 && <div style={styles.columnValue}>{formatCurrency(stageTotal)}</div>}
                </div>
                <span style={styles.columnCount}>{stageDeals.length}</span>
              </div>
              <div style={styles.cardList}>
                {stageDeals.length === 0 && !isOver && (
                  <div style={styles.emptyCol}>No deals</div>
                )}
                {stageDeals.map((deal) => {
                  const stageIds = STAGES.map((s) => s.id);
                  const currentIdx = stageIds.indexOf(deal.stage);
                  const canGoBack = currentIdx > 0;
                  const canGoForward = currentIdx < stageIds.length - 1;
                  return (
                    <div
                      key={deal.id}
                      style={{
                        ...styles.card,
                        ...(draggedId === deal.id ? styles.cardDragging : {}),
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onDragEnd={handleDragEnd}
                      onMouseEnter={(e) => {
                        if (draggedId !== deal.id) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = '';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <GripVertical size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div style={styles.cardTitle}>{deal.title}</div>
                      </div>
                      <div style={styles.cardRow}>
                        <DollarSign size={12} style={{ color: 'var(--success)' }} />
                        <span style={styles.cardValue}>{formatCurrency(deal.value || 0)}</span>
                      </div>
                      <div style={styles.cardRow}>
                        <Percent size={12} style={{ color: 'var(--text-muted)' }} />
                        <span>{deal.probability || 0}% probability</span>
                      </div>
                      <div style={styles.cardRow}>
                        <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                        <span>{formatDate(deal.expectedClose)}</span>
                      </div>
                      <div style={styles.cardActions}>
                        <div style={styles.moveBtnGroup}>
                          <button
                            style={{
                              ...styles.actionBtn,
                              opacity: canGoBack ? 1 : 0.3,
                              pointerEvents: canGoBack ? 'auto' : 'none',
                            }}
                            onClick={() => moveDeal(deal.id, 'backward')}
                            title={`Move to ${currentIdx > 0 ? STAGES[currentIdx - 1].label : ''}`}
                          >
                            <ArrowLeft size={12} />
                          </button>
                          <button
                            style={{
                              ...styles.actionBtn,
                              opacity: canGoForward ? 1 : 0.3,
                              pointerEvents: canGoForward ? 'auto' : 'none',
                            }}
                            onClick={() => moveDeal(deal.id, 'forward')}
                            title={`Move to ${currentIdx < stageIds.length - 1 ? STAGES[currentIdx + 1].label : ''}`}
                          >
                            <ArrowRight size={12} />
                          </button>
                        </div>
                        <button
                          style={{ ...styles.actionBtn, marginLeft: 'auto', color: 'var(--danger)' }}
                          onClick={() => deleteDeal(deal.id)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--danger)18')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {isOver && (
                  <div style={{ ...styles.dropZone, ...styles.dropZoneActive }}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={handleOverlayClick}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>New Deal</div>
              <button style={styles.modalClose} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Deal Title</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Enterprise License Deal"
                    autoFocus
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Stage</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      style={styles.select}
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
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Deal Value ($)</label>
                    <input
                      style={styles.input}
                      type="number"
                      min="0"
                      step="100"
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Probability (%)</label>
                    <input
                      style={styles.input}
                      type="number"
                      min="0"
                      max="100"
                      value={form.probability}
                      onChange={(e) => setForm({ ...form, probability: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Expected Close Date</label>
                  <input
                    style={styles.input}
                    type="date"
                    value={form.expectedClose}
                    onChange={(e) => setForm({ ...form, expectedClose: e.target.value })}
                  />
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.btnSecondary} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
