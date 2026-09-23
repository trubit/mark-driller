import React, { useState, useEffect, useRef } from 'react';

interface CbtCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CbtCalculatorModal: React.FC<CbtCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [memory, setMemory] = useState<number | null>(null);
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG');
  const [isMinimized, setIsMinimized] = useState(false);

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  useEffect(() => {
    // Initial position on load (bottom right of screen)
    const initialX = Math.max(20, window.innerWidth - 380);
    const initialY = Math.max(80, window.innerHeight - 560);
    setPosition({ x: initialX, y: initialY });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 340, dragStartRef.current.posX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 100, dragStartRef.current.posY + dy)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  // Safe Calculator Logic
  const handleDigit = (digit: string) => {
    setDisplay((prev) => {
      if (prev === '0' || prev === 'Error') return digit;
      return prev + digit;
    });
  };

  const handleDecimal = () => {
    if (display === 'Error') {
      setDisplay('0.');
      return;
    }
    // Check if the current number block already has a decimal
    const parts = display.split(/[\+\-\*\/]/);
    const currentNum = parts[parts.length - 1];
    if (!currentNum.includes('.')) {
      setDisplay((prev) => prev + '.');
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    const lastChar = display.slice(-1);
    if (['+', '-', '*', '/'].includes(lastChar)) {
      setDisplay(display.slice(0, -1) + op);
    } else {
      setDisplay(display + op);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleBackspace = () => {
    if (display === 'Error' || display.length <= 1) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleToggleSign = () => {
    if (display === '0' || display === 'Error') return;
    try {
      const val = parseFloat(display);
      if (!isNaN(val)) {
        setDisplay((-val).toString());
      }
    } catch {
      // ignore
    }
  };

  // Factorial helper
  const factorial = (n: number): number => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= Math.min(n, 100); i++) {
      res *= i;
    }
    return res;
  };

  const handleScientific = (func: string) => {
    try {
      const currentVal = parseFloat(display);
      if (isNaN(currentVal)) return;

      let result = 0;
      switch (func) {
        case 'sin': {
          const rad = angleMode === 'DEG' ? (currentVal * Math.PI) / 180 : currentVal;
          result = Math.sin(rad);
          break;
        }
        case 'cos': {
          const rad = angleMode === 'DEG' ? (currentVal * Math.PI) / 180 : currentVal;
          result = Math.cos(rad);
          break;
        }
        case 'tan': {
          const rad = angleMode === 'DEG' ? (currentVal * Math.PI) / 180 : currentVal;
          result = Math.tan(rad);
          break;
        }
        case 'sqrt':
          if (currentVal < 0) {
            setDisplay('Error');
            return;
          }
          result = Math.sqrt(currentVal);
          break;
        case 'sqr':
          result = Math.pow(currentVal, 2);
          break;
        case 'reciprocal':
          if (currentVal === 0) {
            setDisplay('Error');
            return;
          }
          result = 1 / currentVal;
          break;
        case 'ln':
          if (currentVal <= 0) {
            setDisplay('Error');
            return;
          }
          result = Math.log(currentVal);
          break;
        case 'log':
          if (currentVal <= 0) {
            setDisplay('Error');
            return;
          }
          result = Math.log10(currentVal);
          break;
        case 'fact':
          result = factorial(Math.floor(currentVal));
          break;
        case 'pi':
          result = Math.PI;
          break;
        case 'e':
          result = Math.E;
          break;
        default:
          return;
      }

      const formatted = Number.isInteger(result)
        ? result.toString()
        : parseFloat(result.toFixed(8)).toString();
      setExpression(`${func}(${currentVal}) =`);
      setDisplay(formatted);
    } catch {
      setDisplay('Error');
    }
  };

  // Safe arithmetic evaluator (without eval)
  const evaluateExpression = (expr: string): number => {
    const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
    // Only allow digits, decimals, operators, parentheses, spaces
    if (!/^[0-9+\-*/.() ]+$/.test(sanitized)) {
      throw new Error('Invalid characters');
    }
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${sanitized})`);
    const val = fn();
    if (typeof val !== 'number' || !isFinite(val)) {
      throw new Error('Arithmetic overflow or division by zero');
    }
    return val;
  };

  const handleEquals = () => {
    if (display === 'Error') return;
    try {
      const res = evaluateExpression(display);
      const formatted = Number.isInteger(res) ? res.toString() : parseFloat(res.toFixed(8)).toString();
      setExpression(`${display} =`);
      setDisplay(formatted);
    } catch {
      setDisplay('Error');
    }
  };

  // Memory functions
  const handleMemory = (op: 'MC' | 'MR' | 'M+' | 'M-') => {
    const val = parseFloat(display);
    switch (op) {
      case 'MC':
        setMemory(null);
        break;
      case 'MR':
        if (memory !== null) setDisplay(memory.toString());
        break;
      case 'M+':
        if (!isNaN(val)) setMemory((prev) => (prev ?? 0) + val);
        break;
      case 'M-':
        if (!isNaN(val)) setMemory((prev) => (prev ?? 0) - val);
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: typeof window !== 'undefined' && window.innerWidth <= 420 ? '8px' : `${Math.max(8, Math.min(position.x, (typeof window !== 'undefined' ? window.innerWidth : 500) - 350))}px`,
        top: `${Math.max(8, position.y)}px`,
        width: '340px',
        maxWidth: 'calc(100vw - 16px)',
        maxHeight: 'calc(100dvh - 16px)',
        backgroundColor: '#14181c',
        color: '#f6f4ee',
        borderRadius: '8px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
        zIndex: 9999,
        fontFamily: "var(--font-sans)",
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleDragStart}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          background: 'linear-gradient(90deg, #1c2228 0%, #14181c 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, color: '#f3e8df' }}>
          <span style={{ color: 'var(--rust)' }}>🖩</span>
          <span>MARKDRILLER CBT CALCULATOR</span>
          {memory !== null && (
            <span style={{ fontSize: '9px', background: 'var(--rust)', color: '#fff', padding: '1px 4px', borderRadius: '2px' }}>
              M
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8b949e',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '0 4px',
            }}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '□' : '—'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0 4px',
              fontWeight: 700,
            }}
            title="Close Calculator"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div style={{ padding: '12px 14px' }}>
          {/* LCD Screen Display */}
          <div
            style={{
              backgroundColor: '#0c0f12',
              borderRadius: '4px',
              padding: '10px 12px',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '10px',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '10px', color: '#8b949e', minHeight: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {expression}
            </div>
            <div
              style={{
                fontSize: display.length > 12 ? '16px' : '22px',
                fontWeight: 700,
                color: display === 'Error' ? '#ef4444' : '#52e396',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginTop: '2px',
              }}
            >
              {display}
            </div>
          </div>

          {/* Mode Bar (DEG / RAD & Memory) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '10px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setAngleMode(angleMode === 'DEG' ? 'RAD' : 'DEG')}
                style={{
                  padding: '3px 8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--rust)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                {angleMode}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['MC', 'MR', 'M+', 'M-'] as const).map((mOp) => (
                <button
                  key={mOp}
                  type="button"
                  onClick={() => handleMemory(mOp)}
                  style={{
                    padding: '3px 6px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#c9d1d9',
                    fontSize: '10px',
                    cursor: 'pointer',
                    borderRadius: '2px',
                  }}
                >
                  {mOp}
                </button>
              ))}
            </div>
          </div>

          {/* Scientific Keypad Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '6px' }}>
            {[
              { label: 'sin', action: () => handleScientific('sin') },
              { label: 'cos', action: () => handleScientific('cos') },
              { label: 'tan', action: () => handleScientific('tan') },
              { label: 'ln', action: () => handleScientific('ln') },
              { label: 'log', action: () => handleScientific('log') },
              { label: '√x', action: () => handleScientific('sqrt') },
              { label: 'x²', action: () => handleScientific('sqr') },
              { label: '1/x', action: () => handleScientific('reciprocal') },
              { label: 'π', action: () => handleScientific('pi') },
              { label: 'n!', action: () => handleScientific('fact') },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.action}
                style={{
                  padding: '6px 2px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#93a1a1',
                  fontSize: '11px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Standard Keypad Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
            <button
              type="button"
              onClick={handleClear}
              style={{
                padding: '8px 0',
                background: '#4a1515',
                border: '1px solid #7f1d1d',
                color: '#fecaca',
                fontWeight: 700,
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              C
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              style={{
                padding: '8px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#f6f4ee',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={() => handleOperator('/')}
              style={{
                padding: '8px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--rust)',
                fontWeight: 700,
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              ÷
            </button>
            <button
              type="button"
              onClick={() => handleOperator('*')}
              style={{
                padding: '8px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--rust)',
                fontWeight: 700,
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>

            {['7', '8', '9'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDigit(d)}
                style={{
                  padding: '9px 0',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleOperator('-')}
              style={{
                padding: '8px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--rust)',
                fontWeight: 700,
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              -
            </button>

            {['4', '5', '6'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDigit(d)}
                style={{
                  padding: '9px 0',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleOperator('+')}
              style={{
                padding: '8px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--rust)',
                fontWeight: 700,
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              +
            </button>

            {['1', '2', '3'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDigit(d)}
                style={{
                  padding: '9px 0',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={handleEquals}
              style={{
                gridRow: 'span 2',
                background: 'var(--rust)',
                border: '1px solid var(--rust)',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 700,
                borderRadius: '3px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              =
            </button>

            <button
              type="button"
              onClick={handleToggleSign}
              style={{
                padding: '9px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#ffffff',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              ±
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              style={{
                padding: '9px 0',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDecimal}
              style={{
                padding: '9px 0',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              .
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

