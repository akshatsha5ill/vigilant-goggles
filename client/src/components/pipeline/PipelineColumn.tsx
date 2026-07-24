import React from 'react';
import './Pipeline.css';
import { PipelineCard, formatCurrency } from './PipelineCard';

interface PipelineColumnProps {
  stage: any;
  deals: any[];
  isDragOver: boolean;
  draggedId: string | null;
  onDragOver: (e: React.DragEvent, stageId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragStart: (e: React.DragEvent, dealId: string) => void;
  onDragEnd: () => void;
  onMove: (dealId: string, direction: 'forward' | 'backward') => void;
  onDelete: (dealId: string) => void;
}

export const PipelineColumn: React.FC<PipelineColumnProps> = ({
  stage,
  deals,
  isDragOver,
  draggedId,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  onMove,
  onDelete,
}) => {
  const stageTotal = deals.reduce((s, d) => s + (d.value || 0), 0);

  return (
    <div
      className="pipeline-column"
      style={{ borderColor: isDragOver ? stage.color : undefined }}
      onDragOver={(e) => onDragOver(e, stage.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      <div className="column-header">
        <div>
          <div className="column-title" style={{ color: stage.color }}>{stage.label}</div>
          {stageTotal > 0 && <div className="column-value">{formatCurrency(stageTotal)}</div>}
        </div>
        <span className="column-count">{deals.length}</span>
      </div>
      <div className="card-list">
        {deals.length === 0 && !isDragOver && (
          <div className="empty-col">No deals</div>
        )}
        {deals.map((deal) => (
          <PipelineCard
            key={deal.id}
            deal={deal}
            isDragged={draggedId === deal.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onMove={onMove}
            onDelete={onDelete}
          />
        ))}
        {isDragOver && (
          <div className="drop-zone active">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
};
