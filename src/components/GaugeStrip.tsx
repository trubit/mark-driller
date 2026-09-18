import React from 'react';

interface GaugeData {
  number: string;
  label: string;
}

const GAUGE_DATA: GaugeData[] = [
  { number: '120K+', label: 'PAST QUESTIONS INDEXED' },
  { number: '9', label: 'EXAM BOARDS COVERED' },
  { number: '40K+', label: 'STUDENTS THIS TERM' },
  { number: '6', label: 'COUNTRIES ACROSS WEST AFRICA' },
];

export const GaugeStrip: React.FC = () => {
  return (
    <div className="gauge">
      <div className="wrap">
        {GAUGE_DATA.map((item, index) => (
          <div className="gauge-item" key={index}>
            <span className="g-num mono">{item.number}</span>
            <span className="g-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
