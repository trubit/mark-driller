import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { useExamBoards } from '../api/useExamBoards';

const DEFAULT_BOARDS = [
  'JAMB / UTME',
  'WAEC',
  'NECO',
  'GCE',
  'POST-UTME',
  'NB_828284',
];

export const ExamBoards: React.FC = () => {
  const { selectedExamBoard, setSelectedExamBoard } = useAppStore();
  const { data: boardsData } = useExamBoards();

  const boards = boardsData && boardsData.length > 0
    ? boardsData.map((b) => b.shortCode)
    : DEFAULT_BOARDS;

  const activeBoard = boardsData?.find((b) => b.shortCode === selectedExamBoard);

  return (
    <div className="boards" id="boards">
      <div className="wrap">
        <div className="boards-head">
          <h2>Built around the exams you actually sit</h2>
          <span className="eyebrow">Coverage</span>
        </div>
        <div className="board-row">
          {boards.map((board) => {
            const isSelected = selectedExamBoard === board;
            return (
              <button
                key={board}
                type="button"
                className={`board-chip ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedExamBoard(board)}
                aria-pressed={isSelected}
              >
                {board}
              </button>
            );
          })}
        </div>

        {activeBoard && (
          <div
            style={{
              marginTop: '18px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12.5px',
              color: 'var(--ink-soft)',
            }}
          >
            ✓ {activeBoard.name} &nbsp;·&nbsp; {activeBoard.questionCount.toLocaleString()} questions &nbsp;·&nbsp; {activeBoard.syllabusYear} syllabus
          </div>
        )}
      </div>
    </div>
  );
};
