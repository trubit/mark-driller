import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export interface SearchEntry {
  id: string;
  title: string;
  category: 'Workspaces' | 'Study Tools' | 'Curricula & Subjects' | 'Account & Billing';
  path: string;
  icon: string;
  keywords: string[];
}

const SEARCH_DATABASE: SearchEntry[] = [
  // Workspaces
  { id: 'dashboard', title: 'Student Dashboard', category: 'Workspaces', path: '/dashboard', icon: '📊', keywords: ['home', 'overview', 'mocks', 'cbt'] },
  { id: 'questions', title: 'Past Questions Catalog (30,000+ Qs)', category: 'Workspaces', path: '/portal/questions', icon: '📚', keywords: ['past questions', 'practice', 'jamb', 'waec', 'neco'] },
  { id: 'materials', title: 'Study Materials & Syllabus Summaries', category: 'Workspaces', path: '/portal/materials', icon: '📄', keywords: ['pdf', 'notes', 'downloads', 'curriculum'] },
  { id: 'post-utme', title: 'Post-UTME Screening Portal (UNILAG, UI, OAU)', category: 'Workspaces', path: '/portal/post-utme', icon: '🏛️', keywords: ['university', 'aggregate', 'admission', 'screening'] },
  { id: 'analytics', title: 'Exam Readiness & Psychometric Analytics', category: 'Workspaces', path: '/analytics', icon: '📈', keywords: ['readiness', 'score', 'accuracy', 'performance', 'stats'] },

  // Study Tools
  { id: 'flashcards', title: 'Interactive Syllabus Flashcards', category: 'Study Tools', path: '/flashcards', icon: '🎴', keywords: ['leitner', 'spaced repetition', 'cards', 'memory'] },
  { id: 'formulas', title: 'Science Formula Handbook (Physics, Chemistry, Maths)', category: 'Study Tools', path: '/portal/formulas', icon: '📐', keywords: ['equations', 'constants', 'units', 'calculations'] },
  { id: 'dictionary', title: 'Comprehensive Academic Dictionary', category: 'Study Tools', path: '/portal/dictionary', icon: '📖', keywords: ['terms', 'definitions', 'glossary', 'vocabulary'] },
  { id: 'novels', title: 'Prescribed JAMB Literature Novels (The Life Changer)', category: 'Study Tools', path: '/portal/novels', icon: '📕', keywords: ['english', 'novel', 'khadija', 'life changer'] },
  { id: 'games', title: 'Educational Revision Games & Quizzes', category: 'Study Tools', path: '/games', icon: '🎮', keywords: ['quiz', 'interactive', 'drill', 'challenge'] },
  { id: 'challenge', title: 'Weekly National Academic Challenge', category: 'Study Tools', path: '/challenge', icon: '🏆', keywords: ['leaderboard', 'competition', 'weekly', 'prizes'] },
  { id: 'lessons', title: 'Curriculum-Aligned Video Lessons', category: 'Study Tools', path: '/lessons', icon: '📹', keywords: ['video', 'lectures', 'tutorials', 'youtube'] },
  { id: 'blog', title: 'Academic Blog & Chief Examiners’ Reports', category: 'Study Tools', path: '/portal/blog', icon: '📰', keywords: ['guides', 'editorial', 'marking scheme', 'tips', 'strategy'] },
  { id: 'schools', title: 'Nigerian Tertiary Institutions & Cut-Offs', category: 'Study Tools', path: '/portal/schools', icon: '🏫', keywords: ['universities', 'polytechnics', 'cut-off', 'fees', 'courses'] },
  { id: 'careers', title: 'Career Paths & Faculty Prerequisite Guide', category: 'Study Tools', path: '/portal/careers', icon: '🎯', keywords: ['careers', 'courses', 'advising', 'professions'] },

  // Curricula & Subjects
  { id: 'maths', title: 'General Mathematics Past Questions', category: 'Curricula & Subjects', path: '/portal/questions?search=Mathematics', icon: '🔢', keywords: ['maths', 'algebra', 'calculus', 'geometry', 'statistics'] },
  { id: 'english', title: 'Use of English & Comprehension', category: 'Curricula & Subjects', path: '/portal/questions?search=English', icon: '✍️', keywords: ['english', 'lexis', 'structure', 'comprehension', 'oral'] },
  { id: 'physics', title: 'Physics Theory & Calculations', category: 'Curricula & Subjects', path: '/portal/questions?search=Physics', icon: '⚡', keywords: ['mechanics', 'waves', 'electricity', 'optics', 'nuclear'] },
  { id: 'chemistry', title: 'Chemistry & Organic Reactions', category: 'Curricula & Subjects', path: '/portal/questions?search=Chemistry', icon: '🧪', keywords: ['titration', 'organic', 'periodic table', 'stoichiometry'] },
  { id: 'biology', title: 'Biology & Living Organisms', category: 'Curricula & Subjects', path: '/portal/questions?search=Biology', icon: '🧬', keywords: ['genetics', 'ecology', 'physiology', 'botany', 'zoology'] },
  { id: 'economics', title: 'Economics & Price Theory', category: 'Curricula & Subjects', path: '/portal/questions?search=Economics', icon: '📊', keywords: ['microeconomics', 'macroeconomics', 'inflation', 'markets'] },
  { id: 'government', title: 'Government & Political Systems', category: 'Curricula & Subjects', path: '/portal/questions?search=Government', icon: '⚖️', keywords: ['constitution', 'democracy', 'nigerian politics', 'judiciary'] },
  { id: 'literature', title: 'Literature-in-English (Drama, Prose, Poetry)', category: 'Curricula & Subjects', path: '/portal/questions?search=Literature', icon: '🎭', keywords: ['shakespear', 'african prose', 'poems', 'drama'] },

  // Account & Billing
  { id: 'profile', title: 'Student Profile & Academic Record', category: 'Account & Billing', path: '/profile', icon: '👤', keywords: ['account', 'user', 'identity', 'statistics'] },
  { id: 'settings', title: 'Account Settings & Preferences', category: 'Account & Billing', path: '/settings', icon: '⚙️', keywords: ['password', 'phone', 'state', 'preferences'] },
  { id: 'bookmarks', title: 'Saved Bookmarks & Tricky Questions', category: 'Account & Billing', path: '/settings?tab=bookmarks', icon: '📑', keywords: ['saved', 'favorites', 'revision', 'tricky'] },
  { id: 'history', title: 'Full CBT Attempt & Score History', category: 'Account & Billing', path: '/settings?tab=history', icon: '📝', keywords: ['records', 'past results', 'mock history', 'grades'] },
  { id: 'pricing', title: 'Pro Scholar Subscription & Pass Plans', category: 'Account & Billing', path: '/portal/pricing', icon: '★', keywords: ['upgrade', 'billing', 'paystack', 'scratch card', 'activation'] },
  { id: 'activate', title: 'Redeem Physical Scratch Card PIN', category: 'Account & Billing', path: '/portal/activate', icon: '🏷️', keywords: ['reseller', 'scratch card', 'pin', 'token'] },
  { id: 'contact', title: 'Customer Support & WhatsApp Helpdesk', category: 'Account & Billing', path: '/portal/contact', icon: '💬', keywords: ['help', 'enquiries', 'whatsapp', 'support'] },
];

export interface PortalQuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PortalQuickSearchModal: React.FC<PortalQuickSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter items based on query
  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Return top 8 frequent student recommendations
      return SEARCH_DATABASE.slice(0, 8);
    }
    return SEARCH_DATABASE.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
    ).slice(0, 10);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelect = (item: SearchEntry) => {
    onClose();
    navigate(item.path);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'clamp(40px, 10vh, 100px) 16px 40px 16px',
        zIndex: 2100,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: 'var(--white, #ffffff)',
          border: '1.5px solid var(--paper-line)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search Header Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid var(--paper-line)',
            backgroundColor: 'var(--paper, #fdfbf7)',
          }}
        >
          <span style={{ fontSize: '18px', color: 'var(--ink-soft)' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search questions, study materials, formulas, dictionary, topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              fontFamily: "var(--font-sans)",
              color: 'var(--ink)',
              fontWeight: 500,
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--ink-soft)',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '4px',
              }}
            >
              ✕
            </button>
          )}
          <span
            style={{
              fontSize: '11px',
              fontFamily: "var(--font-sans)",
              backgroundColor: 'var(--white)',
              border: '1px solid var(--paper-line)',
              padding: '2px 6px',
              borderRadius: '4px',
              color: 'var(--ink-soft)',
            }}
          >
            ESC
          </span>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    backgroundColor: isSelected
                      ? 'var(--forest-soft, rgba(34, 90, 56, 0.12))'
                      : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? 'var(--forest, #225a38)' : 'var(--ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                        {item.category}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '12px',
                      color: isSelected ? 'var(--forest, #225a38)' : 'var(--ink-soft)',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    Jump ➔
                  </span>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-soft)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔎</div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                No matches found for "{query}"
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px' }}>
                Try searching for "Maths", "JAMB", "Formulas", "Dictionary", or "Post-UTME".
              </p>
            </div>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div
          style={{
            padding: '10px 18px',
            backgroundColor: 'var(--paper, #fdfbf7)',
            borderTop: '1px solid var(--paper-line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--ink-soft)',
            fontFamily: "var(--font-sans)",
          }}
        >
          <div style={{ display: 'flex', gap: '14px' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span style={{ color: 'var(--forest, #225a38)', fontWeight: 600 }}>MarkDriller Quick Search</span>
        </div>
      </div>
    </div>
  );
};

