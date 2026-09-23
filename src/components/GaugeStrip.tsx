import React from 'react';
import { useTelemetryQuery } from '../api/exams';

export const GaugeStrip: React.FC = () => {
  const { data: telemetry } = useTelemetryQuery();

  const totalQuestionsFormatted =
    telemetry && telemetry.totalQuestions > 150000
      ? `${telemetry.totalQuestions.toLocaleString()}+`
      : '150,000+';

  const metrics = [
    {
      number: '5,000,000+',
      label: 'NIGERIAN STUDENTS EMPOWERED',
    },
    {
      number: totalQuestionsFormatted,
      label: 'CURRICULUM PAST QUESTIONS (1978–2026)',
    },
    {
      number: '1,200+',
      label: 'ACCREDITED CBT CENTRES & SCHOOLS',
    },
    {
      number: '99.4%',
      label: 'JAMB & WAEC SCORE BOOST RATE',
    },
  ];

  return (
    <div className="gauge" aria-label="Nationwide Nigerian CBT Performance Metrics">
      <div className="wrap">
        {metrics.map((item, index) => (
          <div className="gauge-item" key={index}>
            <span className="g-num mono">{item.number}</span>
            <span className="g-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

