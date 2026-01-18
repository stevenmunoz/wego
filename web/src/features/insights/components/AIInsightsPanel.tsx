/**
 * AIInsightsPanel Component
 *
 * Displays the AI-generated insights section with a header
 * showing the Claude AI badge and generation timestamp.
 */

import { type FC } from 'react';
import type { Insight } from '../types';
import { InsightCard } from './InsightCard';
import './AIInsightsPanel.css';

interface AIInsightsPanelProps {
  insights: Insight[];
  generatedAt?: Date;
  isLoading: boolean;
}

/**
 * Format date and time in Colombian locale
 */
function formatDateTime(date: Date): string {
  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const AIInsightsPanel: FC<AIInsightsPanelProps> = ({ insights, generatedAt, isLoading }) => {
  if (isLoading) {
    return (
      <div className="ai-insights-panel">
        <div className="ai-insights-panel__header">
          <div className="ai-insights-panel__header-left">
            <span className="ai-insights-panel__badge ai-insights-panel__badge--loading" />
            <div className="ai-insights-panel__title-skeleton" />
          </div>
        </div>
        <div className="ai-insights-panel__list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="insight-card loading" />
          ))}
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="ai-insights-panel ai-insights-panel--empty">
        <div className="ai-insights-panel__header">
          <div className="ai-insights-panel__header-left">
            <span className="ai-insights-panel__badge">{'\u{1F916}'} Claude AI</span>
            <h2 className="ai-insights-panel__title">Recomendaciones del Dia</h2>
          </div>
        </div>
        <div className="ai-insights-panel__empty-state">
          <span className="ai-insights-panel__empty-icon">{'\u{1F916}'}</span>
          <p className="ai-insights-panel__empty-text">
            No hay insights disponibles para esta fecha
          </p>
          <p className="ai-insights-panel__empty-hint">
            Los insights se generan automaticamente cada dia a la 1:00 AM
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-insights-panel">
      <div className="ai-insights-panel__header">
        <div className="ai-insights-panel__header-left">
          <span className="ai-insights-panel__badge">{'\u{1F916}'} Claude AI</span>
          <h2 className="ai-insights-panel__title">Recomendaciones del Dia</h2>
        </div>
        {generatedAt && (
          <span className="ai-insights-panel__timestamp">
            Generado: {formatDateTime(generatedAt)}
          </span>
        )}
      </div>
      <div className="ai-insights-panel__list">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
};
