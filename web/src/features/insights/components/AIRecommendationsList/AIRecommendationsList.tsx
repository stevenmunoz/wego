/**
 * AIRecommendationsList Component
 *
 * Displays numbered AI-generated recommendations with priority badges.
 * Format: [ALTO/MEDIO/BAJO] Title - Description
 */

import { type FC } from 'react';
import type { WeeklyInsight, InsightPriority } from '../../types/insights.types';
import './AIRecommendationsList.css';

interface AIRecommendationsListProps {
  /** Array of AI-generated insights */
  insights: WeeklyInsight[];
}

/**
 * Get badge text for priority
 */
function getPriorityLabel(priority: InsightPriority): string {
  switch (priority) {
    case 'high':
      return 'ALTO';
    case 'medium':
      return 'MEDIO';
    case 'low':
      return 'BAJO';
  }
}

export const AIRecommendationsList: FC<AIRecommendationsListProps> = ({ insights }) => {
  if (insights.length === 0) {
    return null;
  }

  return (
    <ol className="ai-recommendations">
      {insights.map((insight, index) => (
        <li key={insight.id} className="ai-recommendations__item">
          <div className="ai-recommendations__header">
            <span className="ai-recommendations__number">{index + 1}.</span>
            <span
              className={`ai-recommendations__badge ai-recommendations__badge--${insight.priority}`}
            >
              {getPriorityLabel(insight.priority)}
            </span>
            <span className="ai-recommendations__title">{insight.title}</span>
          </div>
          <p className="ai-recommendations__description">{insight.description}</p>
        </li>
      ))}
    </ol>
  );
};
