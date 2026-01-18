/**
 * InsightCard Component
 *
 * Displays a single AI-generated insight with priority badge,
 * icon, title, description, and optional value change indicator.
 */

import { type FC } from 'react';
import type { Insight, InsightType } from '../types';
import './InsightCard.css';

interface InsightCardProps {
  insight: Insight;
}

/**
 * Icon mapping for insight types
 */
const INSIGHT_ICONS: Record<InsightType, string> = {
  growth_opportunity: '\u{1F4C8}', // Chart increasing
  anomaly_alert: '\u{26A0}\u{FE0F}', // Warning sign
  performance_comparison: '\u{1F4CA}', // Bar chart
  action_recommendation: '\u{1F4A1}', // Light bulb
  trend_analysis: '\u{1F4C9}', // Chart decreasing
};

/**
 * Priority badge colors and labels
 */
const PRIORITY_CONFIG = {
  high: { emoji: '\u{1F534}', label: 'ALTA' },
  medium: { emoji: '\u{1F7E1}', label: 'MEDIA' },
  low: { emoji: '\u{1F7E2}', label: 'BAJA' },
};

export const InsightCard: FC<InsightCardProps> = ({ insight }) => {
  const icon = INSIGHT_ICONS[insight.type] || '\u{1F4A1}';
  const priorityConfig = PRIORITY_CONFIG[insight.priority];

  return (
    <div className={`insight-card insight-card--${insight.priority}`}>
      <div className="insight-card__icon">{icon}</div>

      <div className="insight-card__content">
        <h3 className="insight-card__title">{insight.title}</h3>
        <p className="insight-card__description">{insight.description}</p>
      </div>

      <div className="insight-card__meta">
        <span className={`insight-card__priority insight-card__priority--${insight.priority}`}>
          {priorityConfig.emoji} {priorityConfig.label}
        </span>

        {insight.value_change != null && (
          <span
            className={`insight-card__change ${insight.value_change >= 0 ? 'insight-card__change--positive' : 'insight-card__change--negative'}`}
          >
            {insight.value_change >= 0 ? '+' : ''}
            {insight.value_change.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
};
