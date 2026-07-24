import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { dealsDB } from '../../services/local-db/deals';
import { STAGES, formatCurrency } from '../../components/pipeline/PipelineCard';
import { PipelineColumn } from '../../components/pipeline/PipelineColumn';
import { NewDealModal, DealFormData } from '../../components/pipeline/NewDealModal';
import { Deal } from '../../types';
import '../../components/pipeline/Pipeline.css';

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const loadDeals = useCallback(async () => {
    const all = await dealsDB.getAll();
    setDeals(all);
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const dealsByStage = STAGES.reduce((acc: any, stage) => {
    acc[stage.id] = deals.filter((d) => d.stage === stage.id).sort((a, b) => (a.order || 0) - (b.order || 0));
    return acc;
  }, {});

  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const openValue = deals
    .filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .reduce((sum, d) => sum + (d.value || 0), 0);
  const wonValue = deals.filter((d) => d.stage === 'closed_won').reduce((sum, d) => sum + (d.value || 0), 0);
  const weightedValue = deals.reduce((sum, d) => sum + (d.value || 0) * ((d.probability || 0) / 100), 0);

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedId(dealId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string, targetDealId?: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData('text/plain');
    if (!dealId || dealId === targetDealId) return;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    const updatedDeals = [...deals];
    const dealIndex = updatedDeals.findIndex(d => d.id === dealId);
    
    // Update stage and timestamp
    updatedDeals[dealIndex] = { ...deal, stage: stageId, updatedAt: new Date().toISOString() };
    
    // Sort items in target stage excluding the dragged item
    const stageDeals = updatedDeals
      .filter(d => d.stage === stageId && d.id !== dealId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Insert dragged item at correct position
    if (targetDealId) {
      const targetIndex = stageDeals.findIndex(d => d.id === targetDealId);
      if (targetIndex !== -1) {
        stageDeals.splice(targetIndex, 0, updatedDeals[dealIndex]);
      } else {
        stageDeals.push(updatedDeals[dealIndex]);
      }
    } else {
      stageDeals.push(updatedDeals[dealIndex]);
    }
    
    // Assign new orders
    const dealsToSave: Deal[] = [];
    stageDeals.forEach((d, i) => {
      if (d.order !== i || d.id === dealId) {
        d.order = i;
        dealsToSave.push(d);
      }
    });

    // Optimistic update
    const finalDeals = updatedDeals.map(d => {
      const saved = dealsToSave.find(s => s.id === d.id);
      return saved ? saved : d;
    });
    setDeals(finalDeals);

    // Persist changes
    if (dealsToSave.length > 0) {
      await dealsDB.bulkPut(dealsToSave);
      loadDeals();
    }
    
    setDraggedId(null);
  };

  const moveDeal = async (dealId: string, direction: 'forward' | 'backward') => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    const stageIds = STAGES.map((s) => s.id);
    const idx = stageIds.indexOf(deal.stage);
    const newIdx = direction === 'forward' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= stageIds.length) return;
    await dealsDB.put({ ...deal, stage: stageIds[newIdx], updatedAt: new Date().toISOString() });
    loadDeals();
  };

  const deleteDeal = async (dealId: string) => {
    await dealsDB.delete(dealId);
    loadDeals();
  };

  const handleSubmitModal = async (form: DealFormData) => {
    const stageCount = deals.filter(d => d.stage === form.stage).length;
    await dealsDB.put({
      id: crypto.randomUUID(),
      leadId: '',
      title: form.title,
      stage: form.stage,
      value: parseFloat(form.value) || 0,
      probability: parseInt(form.probability) || 0,
      expectedClose: form.expectedClose || null,
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: stageCount,
    });
    setShowModal(false);
    loadDeals();
  };

  return (
    <div className="animate-fade-in">
      <div className="pipeline-header">
        <div>
          <h1 className="pipeline-title">Pipeline</h1>
          <p className="pipeline-subtitle">Track and manage your deals through each stage.</p>
        </div>
        <button
          className="add-btn"
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} /> New Deal
        </button>
      </div>

      <div className="summary-row">
        <div className="summary-card">
          <div className="summary-label">Total Pipeline</div>
          <div className="summary-value">{formatCurrency(totalValue)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Open Deals</div>
          <div className="summary-value" style={{ color: 'var(--accent-primary)' }}>{formatCurrency(openValue)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Weighted Value</div>
          <div className="summary-value" style={{ color: 'var(--warning)' }}>{formatCurrency(weightedValue)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Won Revenue</div>
          <div className="summary-value" style={{ color: 'var(--success)' }}>{formatCurrency(wonValue)}</div>
        </div>
      </div>

      <div className="board-container">
        {STAGES.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            deals={dealsByStage[stage.id] || []}
            isDragOver={dragOverStage === stage.id}
            draggedId={draggedId}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onMove={moveDeal}
            onDelete={deleteDeal}
          />
        ))}
      </div>

      {showModal && (
        <NewDealModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitModal}
        />
      )}
    </div>
  );
}
