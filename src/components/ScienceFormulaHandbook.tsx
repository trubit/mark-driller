import React, { useState } from 'react';

interface FormulaCard {
  id: string;
  discipline: 'MATHEMATICS' | 'PHYSICS' | 'CHEMISTRY' | 'FURTHER_MATHS';
  topic: string;
  name: string;
  expression: string;
  variables: { symbol: string; meaning: string; unit?: string }[];
  description: string;
  sampleProblem?: {
    question: string;
    solution: string;
  };
}

const FORMULA_DATABASE: FormulaCard[] = [
  // Mathematics
  {
    id: 'm-quad',
    discipline: 'MATHEMATICS',
    topic: 'Algebra & Polynomials',
    name: 'Quadratic Equation Formula',
    expression: 'x = (-b ± √(b² - 4ac)) / (2a)',
    variables: [
      { symbol: 'a', meaning: 'Coefficient of x² (a ≠ 0)' },
      { symbol: 'b', meaning: 'Coefficient of x' },
      { symbol: 'c', meaning: 'Constant term' },
      { symbol: 'b² - 4ac', meaning: 'Discriminant (Δ): Determines nature of roots' },
    ],
    description: 'Finds real or complex roots of any second-degree polynomial ax² + bx + c = 0.',
    sampleProblem: {
      question: 'Find the roots of 2x² - 5x + 3 = 0.',
      solution: 'a=2, b=-5, c=3. Δ = (-5)² - 4(2)(3) = 25 - 24 = 1. x = (5 ± 1)/4 => x₁ = 6/4 = 1.5, x₂ = 4/4 = 1.',
    },
  },
  {
    id: 'm-ap',
    discipline: 'MATHEMATICS',
    topic: 'Sequences & Series',
    name: 'Arithmetic Progression (AP) — nth Term & Sum',
    expression: 'Tₙ = a + (n - 1)d   |   Sₙ = n/2 [2a + (n - 1)d]',
    variables: [
      { symbol: 'a', meaning: 'First term of sequence' },
      { symbol: 'd', meaning: 'Common difference (Tₙ - Tₙ₋₁)' },
      { symbol: 'n', meaning: 'Position or number of terms' },
      { symbol: 'Sₙ', meaning: 'Sum of first n terms' },
    ],
    description: 'Calculates specific term values and cumulative sums for linear progression series.',
  },
  {
    id: 'm-gp',
    discipline: 'MATHEMATICS',
    topic: 'Sequences & Series',
    name: 'Geometric Progression (GP) — Sum to Infinity',
    expression: 'S_∞ = a / (1 - r)   [Condition: |r| < 1]',
    variables: [
      { symbol: 'a', meaning: 'First term of sequence' },
      { symbol: 'r', meaning: 'Common ratio (Tₙ / Tₙ₋₁)' },
      { symbol: 'S_∞', meaning: 'Limiting infinite sum' },
    ],
    description: 'Convergent geometric series sum frequently tested in JAMB UTME and WAEC objective sections.',
  },
  {
    id: 'm-diff',
    discipline: 'MATHEMATICS',
    topic: 'Differential Calculus',
    name: 'Power Rule of Differentiation',
    expression: 'd/dx (a·xⁿ) = a·n·xⁿ⁻¹',
    variables: [
      { symbol: 'a', meaning: 'Constant coefficient' },
      { symbol: 'n', meaning: 'Real power exponent' },
    ],
    description: 'Fundamental derivative rule for calculating gradients of curves and marginal rates of change.',
  },

  // Physics
  {
    id: 'p-kin1',
    discipline: 'PHYSICS',
    topic: 'Linear Motion & Kinematics',
    name: 'Equations of Uniform Acceleration',
    expression: 'v = u + at   |   s = ut + ½at²   |   v² = u² + 2as',
    variables: [
      { symbol: 'u', meaning: 'Initial velocity', unit: 'm/s' },
      { symbol: 'v', meaning: 'Final velocity', unit: 'm/s' },
      { symbol: 'a', meaning: 'Uniform acceleration', unit: 'm/s²' },
      { symbol: 't', meaning: 'Time elapsed', unit: 'seconds (s)' },
      { symbol: 's', meaning: 'Displacement', unit: 'metres (m)' },
    ],
    description: 'Standard Galilean rectilinear motion under constant acceleration, e.g. free fall under gravity (g = 9.8 or 10 m/s²).',
  },
  {
    id: 'p-newton2',
    discipline: 'PHYSICS',
    topic: 'Dynamics & Force',
    name: "Newton's Second Law of Motion",
    expression: 'F = m · a = (m·v - m·u) / t',
    variables: [
      { symbol: 'F', meaning: 'Net resultant force', unit: 'Newtons (N = kg·m/s²)' },
      { symbol: 'm', meaning: 'Inertial mass', unit: 'kilograms (kg)' },
      { symbol: 'a', meaning: 'Acceleration produced', unit: 'm/s²' },
      { symbol: 'mv - mu', meaning: 'Change in linear momentum (Impulse)', unit: 'N·s' },
    ],
    description: 'Rate of change of momentum is directly proportional to applied force in the direction of force.',
  },
  {
    id: 'p-ohm',
    discipline: 'PHYSICS',
    topic: 'Current Electricity',
    name: "Ohm's Law & Electrical Power",
    expression: 'V = I · R   |   P = I·V = I²·R = V² / R',
    variables: [
      { symbol: 'V', meaning: 'Potential difference / Voltage', unit: 'Volts (V)' },
      { symbol: 'I', meaning: 'Electric current', unit: 'Amperes (A)' },
      { symbol: 'R', meaning: 'Electrical resistance', unit: 'Ohms (Ω)' },
      { symbol: 'P', meaning: 'Electrical power dissipation', unit: 'Watts (W = J/s)' },
    ],
    description: 'Applies to ohmic metallic conductors held at constant temperature.',
  },
  {
    id: 'p-wave',
    discipline: 'PHYSICS',
    topic: 'Waves & Sound',
    name: 'Fundamental Wave Equation',
    expression: 'v = f · λ = λ / T',
    variables: [
      { symbol: 'v', meaning: 'Wave propagation speed', unit: 'm/s' },
      { symbol: 'f', meaning: 'Frequency', unit: 'Hertz (Hz = s⁻¹)' },
      { symbol: 'λ', meaning: 'Wavelength', unit: 'metres (m)' },
      { symbol: 'T', meaning: 'Period (1/f)', unit: 'seconds (s)' },
    ],
    description: 'Governs both mechanical (sound, water) and electromagnetic (light, radio) periodic waveforms.',
  },

  // Chemistry
  {
    id: 'c-gas',
    discipline: 'CHEMISTRY',
    topic: 'Gas Laws & States of Matter',
    name: 'Ideal Gas Law & General Gas Equation',
    expression: 'P·V = n·R·T   |   (P₁·V₁) / T₁ = (P₂·V₂) / T₂',
    variables: [
      { symbol: 'P', meaning: 'Pressure', unit: 'atm or N/m² (Pa)' },
      { symbol: 'V', meaning: 'Volume', unit: 'dm³ or m³' },
      { symbol: 'n', meaning: 'Amount of substance', unit: 'moles (mol)' },
      { symbol: 'R', meaning: 'Universal Gas Constant', unit: '8.314 J/(mol·K)' },
      { symbol: 'T', meaning: 'Absolute Temperature', unit: 'Kelvin (K = °C + 273)' },
    ],
    description: 'Combines Boyle’s, Charles’s, and Avogadro’s laws for gases at moderate pressures and temperatures.',
  },
  {
    id: 'c-mole',
    discipline: 'CHEMISTRY',
    topic: 'Stoichiometry & Calculations',
    name: 'Mole Concept & Molar Concentrations',
    expression: 'n = mass / M   |   C = n / V = mass / (M · V)',
    variables: [
      { symbol: 'n', meaning: 'Number of moles', unit: 'mol' },
      { symbol: 'mass', meaning: 'Reactant mass', unit: 'grams (g)' },
      { symbol: 'M', meaning: 'Molar mass of compound', unit: 'g/mol' },
      { symbol: 'C', meaning: 'Molar concentration', unit: 'mol/dm³ (M)' },
      { symbol: 'V', meaning: 'Solution volume', unit: 'dm³ (litres)' },
    ],
    description: 'Essential for WAEC/NECO volumetric analysis (titration calculations) and UTME stoichiometry.',
  },
  {
    id: 'c-faraday',
    discipline: 'CHEMISTRY',
    topic: 'Electrochemistry',
    name: "Faraday's Laws of Electrolysis",
    expression: 'm = (I · t · M) / (n · F)   |   Q = I · t',
    variables: [
      { symbol: 'm', meaning: 'Mass of element liberated at electrode', unit: 'grams (g)' },
      { symbol: 'I', meaning: 'Steady electric current', unit: 'Amperes (A)' },
      { symbol: 't', meaning: 'Duration of electrolysis', unit: 'seconds (s)' },
      { symbol: 'F', meaning: 'Faraday constant', unit: '96,500 Coulombs/mol' },
      { symbol: 'n', meaning: 'Number of electrons transferred per ion', unit: 'valency' },
    ],
    description: 'Mass deposited during electrolysis is directly proportional to quantity of electricity passed.',
  },
];

export const ScienceFormulaHandbook: React.FC = () => {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Interactive Quick Calculator state
  const [calcType, setCalcType] = useState<'KINEMATICS' | 'OHM' | 'FORCE'>('KINEMATICS');
  const [calcInputs, setCalcInputs] = useState<Record<string, number>>({ u: 0, a: 9.8, t: 3 });
  const [calcResult, setCalcResult] = useState<string | null>('v = 29.4 m/s');

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCalculate = () => {
    if (calcType === 'KINEMATICS') {
      const u = Number(calcInputs.u) || 0;
      const a = Number(calcInputs.a) || 0;
      const t = Number(calcInputs.t) || 0;
      const v = u + a * t;
      const s = u * t + 0.5 * a * t * t;
      setCalcResult(`Final Velocity (v) = ${v.toFixed(2)} m/s | Displacement (s) = ${s.toFixed(2)} m`);
    } else if (calcType === 'OHM') {
      const i = Number(calcInputs.i) || 0;
      const r = Number(calcInputs.r) || 0;
      const v = i * r;
      const p = i * v;
      setCalcResult(`Potential Difference (V) = ${v.toFixed(2)} Volts | Power (P) = ${p.toFixed(2)} Watts`);
    } else if (calcType === 'FORCE') {
      const m = Number(calcInputs.m) || 0;
      const a = Number(calcInputs.a) || 0;
      const f = m * a;
      setCalcResult(`Net Force (F) = ${f.toFixed(2)} Newtons`);
    }
  };

  const filteredFormulas = FORMULA_DATABASE.filter((f) => {
    const matchesDisc = selectedDiscipline === 'ALL' || f.discipline === selectedDiscipline;
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.expression.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDisc && matchesSearch;
  });

  return (
    <div className="portal-layout premium-portal-page premium-learning-page" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <div className="wrap" style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <span className="eyebrow" style={{ margin: 0 }}>Scientific Notebook &amp; Formula Handbook</span>
          <h1 style={{ fontSize: '28px', color: 'var(--ink)', margin: '6px 0' }}>
            Mathematics, Physics &amp; Chemistry Formulas
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '750px', margin: 0 }}>
            Official WAEC, NECO and JAMB UTME high-yield scientific equations, standard SI units, variable breakdowns, and verified parameter solvers.
          </p>
        </div>

        {/* Interactive Parameter Calculator Card */}
        <div
          style={{
            background: 'var(--white)',
            border: '1px solid var(--paper-line)',
            borderLeft: '4px solid var(--rust)',
            borderRadius: '6px',
            padding: '20px 24px',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
            <div>
              <span className="eyebrow" style={{ fontSize: '10px' }}>Deterministic Arithmetic Solver</span>
              <h3 style={{ fontSize: '17px', margin: '2px 0 0 0', color: 'var(--ink)' }}>
                Equation Verification &amp; Parameter Calculator
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['KINEMATICS', 'OHM', 'FORCE'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setCalcType(t);
                    setCalcResult(null);
                    if (t === 'KINEMATICS') setCalcInputs({ u: 0, a: 9.8, t: 3 });
                    if (t === 'OHM') setCalcInputs({ i: 2.5, r: 12 });
                    if (t === 'FORCE') setCalcInputs({ m: 15, a: 4 });
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: "var(--font-sans)",
                    border: calcType === t ? '1px solid var(--rust)' : '1px solid var(--paper-line)',
                    background: calcType === t ? 'var(--rust)' : 'var(--paper)',
                    color: calcType === t ? '#fff' : 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  {t === 'KINEMATICS' ? 'Kinematics (v=u+at)' : t === 'OHM' ? "Ohm's Law (V=IR)" : "Newton's 2nd (F=ma)"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            {Object.keys(calcInputs).map((key) => (
              <div key={key} style={{ minWidth: '100px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)', marginBottom: '3px' }}>
                  {key.toUpperCase()} value:
                </label>
                <input
                  type="number"
                  value={calcInputs[key]}
                  onChange={(e) => setCalcInputs({ ...calcInputs, [key]: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid var(--paper-line)',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: "var(--font-sans)",
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              className="btn-custom btn-custom-primary"
              onClick={handleCalculate}
              style={{ padding: '7px 18px', fontSize: '12.5px', fontFamily: "var(--font-sans)" }}
            >
              Solve Equation
            </button>
          </div>

          {calcResult && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                background: 'var(--paper)',
                borderRadius: '4px',
                border: '1px solid var(--paper-line)',
                fontFamily: "var(--font-sans)",
                fontSize: '13px',
                color: 'var(--rust)',
                fontWeight: 600,
              }}
            >
              Result: {calcResult}
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--white)',
            padding: '14px 18px',
            borderRadius: '6px',
            border: '1px solid var(--paper-line)',
            marginBottom: '24px',
          }}
        >
          <input
            type="text"
            placeholder="Search formulas by name, symbol, or topic (e.g. quadratic, Faraday, v=u+at)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '260px',
              padding: '8px 12px',
              border: '1px solid var(--paper-line)',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(['ALL', 'MATHEMATICS', 'PHYSICS', 'CHEMISTRY'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDiscipline(d)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  border: selectedDiscipline === d ? '1px solid var(--rust)' : '1px solid var(--paper-line)',
                  background: selectedDiscipline === d ? 'var(--rust)' : 'var(--paper)',
                  color: selectedDiscipline === d ? '#ffffff' : 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Formulas Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredFormulas.map((formula) => {
            const isBookmarked = bookmarkedIds.includes(formula.id);
            return (
              <div
                key={formula.id}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--paper-line)',
                  borderRadius: '6px',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: '10.5px',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        background: 'var(--paper)',
                        color: 'var(--ink-soft)',
                        border: '1px solid var(--paper-line)',
                      }}
                    >
                      {formula.discipline} • {formula.topic}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(formula.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: isBookmarked ? 'var(--rust)' : 'var(--paper-line)',
                      }}
                      title="Bookmark Formula"
                    >
                      ★
                    </button>
                  </div>

                  <h3 style={{ fontSize: '17px', margin: '4px 0 10px 0', color: 'var(--ink)' }}>
                    {formula.name}
                  </h3>

                  {/* Mathematical Expression Box */}
                  <div
                    style={{
                      background: 'var(--paper)',
                      padding: '12px 14px',
                      borderRadius: '4px',
                      border: '1px solid var(--paper-line)',
                      fontFamily: "var(--font-sans)",
                      fontSize: '14.5px',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      marginBottom: '14px',
                      overflowX: 'auto',
                    }}
                  >
                    {formula.expression}
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '14px' }}>
                    {formula.description}
                  </p>

                  {/* Variables Table */}
                  <div style={{ marginBottom: '14px' }}>
                    <span className="eyebrow" style={{ fontSize: '10px' }}>Variable Specifications</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      {formula.variables.map((v, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            fontFamily: "var(--font-sans)",
                            padding: '2px 0',
                            borderBottom: '1px dashed rgba(20, 24, 28, 0.08)',
                          }}
                        >
                          <span><strong>{v.symbol}</strong> : {v.meaning}</span>
                          {v.unit && <span style={{ color: 'var(--rust)', marginLeft: '8px' }}>[{v.unit}]</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {formula.sampleProblem && (
                    <div
                      style={{
                        background: 'rgba(168, 86, 47, 0.05)',
                        padding: '10px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        marginTop: '8px',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--rust)', marginBottom: '3px' }}>WAEC/JAMB Worked Example:</div>
                      <div style={{ color: 'var(--ink)', marginBottom: '4px' }}>Q: {formula.sampleProblem.question}</div>
                      <div style={{ color: 'var(--ink-soft)', fontFamily: "var(--font-sans)", fontSize: '11px' }}>
                        Sol: {formula.sampleProblem.solution}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

