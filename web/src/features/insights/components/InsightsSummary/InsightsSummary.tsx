/**
 * InsightsSummary Component
 *
 * Displays weekly business insights in a conversational email-style format.
 * Shows: Viajes, Cancelaciones, Kilómetros sections with key metrics.
 */

import { type FC } from 'react';
import type { WeeklyInsights } from '../../types/insights.types';
import { VehicleFinanceCard } from '../VehicleFinanceCard';
import { AIRecommendationsList } from '../AIRecommendationsList';
import './InsightsSummary.css';

interface InsightsSummaryProps {
  /** Weekly insights data */
  data: WeeklyInsights;
  /** User's display name for greeting */
  userName?: string;
}

/**
 * Format number as Colombian pesos (COP)
 */
function formatCOP(amount: number): string {
  return amount.toLocaleString('es-CO');
}

/**
 * Format percentage with sign
 */
function formatPercent(value: number | null, includeSign = true): string {
  if (value === null) return 'N/A';
  const sign = includeSign && value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Format date range for display
 */
function formatWeekRange(start: Date, end: Date): string {
  const startDay = start.getDate();
  const endDay = end.getDate();

  const monthFormatter = new Intl.DateTimeFormat('es-CO', { month: 'long' });
  const yearFormatter = new Intl.DateTimeFormat('es-CO', { year: 'numeric' });

  const startMonth = monthFormatter.format(start);
  const endMonth = monthFormatter.format(end);
  const year = yearFormatter.format(end);

  if (start.getMonth() === end.getMonth()) {
    return `${startDay} al ${endDay} de ${startMonth} de ${year}`;
  }

  return `${startDay} de ${startMonth} al ${endDay} de ${endMonth} de ${year}`;
}

export const InsightsSummary: FC<InsightsSummaryProps> = ({ data, userName = 'Usuario' }) => {
  const {
    rides,
    cancellations,
    kilometers,
    vehicle_finances,
    insights,
    generated_at,
    week_start,
    week_end,
  } = data;

  const weekRangeText = formatWeekRange(week_start, week_end);

  // Calculate cancellation percentages by reason
  const cancellationTotal =
    cancellations.by_reason.by_passenger + cancellations.by_reason.by_driver;
  const passengerPercent =
    cancellationTotal > 0 ? (cancellations.by_reason.by_passenger / cancellationTotal) * 100 : 0;
  const driverPercent =
    cancellationTotal > 0 ? (cancellations.by_reason.by_driver / cancellationTotal) * 100 : 0;

  return (
    <article className="insights-summary">
      {/* Greeting */}
      <header className="insights-summary__greeting">
        <p>Hola {userName},</p>
        <p>Aquí tienes el resumen de la semana del {weekRangeText}:</p>
      </header>

      {/* VIAJES Section */}
      <section className="insights-summary__section">
        <h2 className="insights-summary__section-title">VIAJES</h2>

        <div className="insights-summary__content">
          <p className="insights-summary__highlight">
            Se completaron <strong>{rides.completed}</strong> viajes esta semana
            {rides.change_vs_previous_week !== null && (
              <span
                className={`insights-summary__change ${rides.change_vs_previous_week >= 0 ? 'positive' : 'negative'}`}
              >
                {' '}
                ({formatPercent(rides.change_vs_previous_week)} vs semana anterior)
              </span>
            )}
            .
          </p>

          <ul className="insights-summary__breakdown">
            <li>
              <span className="insights-summary__source">InDriver:</span>
              <span className="insights-summary__source-data">
                {rides.by_source.indriver.count} viajes (
                {rides.by_source.indriver.percentage.toFixed(0)}%) →{' '}
                <span className="insights-summary__amount">
                  ${formatCOP(rides.by_source.indriver.revenue)} COP
                </span>
              </span>
            </li>
            <li>
              <span className="insights-summary__source">Externos:</span>
              <span className="insights-summary__source-data">
                {rides.by_source.external.count} viajes (
                {rides.by_source.external.percentage.toFixed(0)}%) →{' '}
                <span className="insights-summary__amount">
                  ${formatCOP(rides.by_source.external.revenue)} COP
                </span>
              </span>
            </li>
          </ul>

          <p className="insights-summary__total">
            Ingreso total:{' '}
            <span className="insights-summary__amount">${formatCOP(rides.total_revenue)} COP</span>
            {' | '}
            Promedio:{' '}
            <span className="insights-summary__amount">
              ${formatCOP(rides.average_per_ride)} COP
            </span>
            /viaje
          </p>
        </div>
      </section>

      {/* CANCELACIONES Section */}
      <section className="insights-summary__section">
        <h2 className="insights-summary__section-title">CANCELACIONES</h2>

        <div className="insights-summary__content">
          <p className="insights-summary__highlight">
            Hubo <strong>{cancellations.total}</strong> cancelaciones esta semana (tasa:{' '}
            <strong>{cancellations.rate.toFixed(1)}%</strong>):
          </p>

          <ul className="insights-summary__breakdown">
            <li>
              <span className="insights-summary__source">Por pasajero:</span>
              <span className="insights-summary__source-data">
                {cancellations.by_reason.by_passenger} ({passengerPercent.toFixed(0)}%)
              </span>
            </li>
            <li>
              <span className="insights-summary__source">Por conductor:</span>
              <span className="insights-summary__source-data">
                {cancellations.by_reason.by_driver} ({driverPercent.toFixed(0)}%)
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* KILÓMETROS Section */}
      <section className="insights-summary__section">
        <h2 className="insights-summary__section-title">KILÓMETROS</h2>

        <div className="insights-summary__content">
          <p className="insights-summary__highlight">
            Los vehículos recorrieron <strong>{formatCOP(kilometers.total_km)}</strong> km en total
            esta semana.
          </p>

          <ul className="insights-summary__breakdown">
            <li>
              <span className="insights-summary__source">Promedio por viaje:</span>
              <span className="insights-summary__source-data">
                {kilometers.average_per_ride.toFixed(1)} km
              </span>
            </li>
            <li>
              <span className="insights-summary__source">Ingreso por km:</span>
              <span className="insights-summary__source-data">
                <span className="insights-summary__amount">
                  ${formatCOP(kilometers.revenue_per_km)} COP
                </span>
                /km
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* FINANZAS POR VEHÍCULO Section */}
      {vehicle_finances.length > 0 && (
        <section className="insights-summary__section">
          <h2 className="insights-summary__section-title">FINANZAS POR VEHÍCULO</h2>

          <div className="insights-summary__vehicles">
            {vehicle_finances.map((vehicle) => (
              <VehicleFinanceCard key={vehicle.vehicle_id} vehicle={vehicle} />
            ))}
          </div>
        </section>
      )}

      {/* AI RECOMMENDATIONS Section */}
      {insights.length > 0 && (
        <section className="insights-summary__section insights-summary__section--recommendations">
          <h2 className="insights-summary__section-title">RECOMENDACIONES (Claude AI)</h2>
          <p className="insights-summary__generated-at">
            Generado:{' '}
            {new Intl.DateTimeFormat('es-CO', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(generated_at)}
          </p>

          <AIRecommendationsList insights={insights} />
        </section>
      )}
    </article>
  );
};
