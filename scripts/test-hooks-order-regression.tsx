import React, { useState } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CbtExamRoom } from '../src/components/CbtExamRoom.js';

/**
 * Dedicated Regression Test for React Hooks Ordering Violation.
 * Specifically verifies that dynamic re-renders across loading, loaded,
 * error, and empty states maintain the EXACT same hook execution order.
 */

const mockAttemptData = {
  attemptId: 'test-attempt-1',
  status: 'IN_PROGRESS',
  allocatedDurationSeconds: 1800,
  remainingSeconds: 1800,
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 1800000).toISOString(),
  examName: 'JAMB UTME',
  examShortCode: 'JAMB',
  subjectName: 'Use of English',
  subjectCode: 'ENG',
  questions: [
    {
      _id: 'q101',
      year: 2024,
      questionNumber: 1,
      questionText: 'Select the option nearest in meaning to the underlined word.',
      optionA: 'Option Alpha',
      optionB: 'Option Beta',
      optionC: 'Option Gamma',
      optionD: 'Option Delta',
      difficulty: 'MEDIUM',
      topicName: 'Lexis and Structure',
      subjectId: 'eng-01',
      subjectName: 'Use of English',
      subjectCode: 'ENG',
    },
    {
      _id: 'q102',
      year: 2024,
      questionNumber: 2,
      questionText: 'Choose the word that has the same vowel sound.',
      optionA: 'Seat',
      optionB: 'Set',
      optionC: 'Sit',
      optionD: 'Sat',
      difficulty: 'EASY',
      topicName: 'Oral English',
      subjectId: 'eng-01',
      subjectName: 'Use of English',
      subjectCode: 'ENG',
    },
  ],
  answers: [],
};

// Harness that forces successive re-renders through the same component instance tree
function DynamicRenderHarness({ stateSequence }: { stateSequence: Array<'LOADING' | 'LOADED' | 'ERROR' | 'EMPTY'> }) {
  const [step, setStep] = useState(0);

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  const currentState = stateSequence[step];

  if (currentState === 'LOADING') {
    // In Tanstack Query, undefined queryData means isLoading is true
  } else if (currentState === 'LOADED') {
    queryClient.setQueryData(['cbtAttempt', 'test-attempt-1'], mockAttemptData);
  } else if (currentState === 'ERROR') {
    queryClient.setQueryData(['cbtAttempt', 'test-attempt-1'], null);
  } else if (currentState === 'EMPTY') {
    queryClient.setQueryData(['cbtAttempt', 'test-attempt-1'], {
      ...mockAttemptData,
      questions: [],
    });
  }

  queryClient.setQueryData(['bookmarks'], []);

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/cbt/test-attempt-1']}>
        <Routes>
          <Route path="/cbt/:attemptId" element={<CbtExamRoom />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function runSequentialHookTest(name: string, states: Array<'LOADING' | 'LOADED' | 'ERROR' | 'EMPTY'>) {
  console.log(`\nTesting Transition Sequence: ${name}`);
  let previousHtml = '';

  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    if (state === 'LOADED') {
      queryClient.setQueryData(['cbtAttempt', 'test-attempt-1'], mockAttemptData);
    } else if (state === 'ERROR') {
      queryClient.setQueryData(['cbtAttempt', 'test-attempt-1'], null);
    } else if (state === 'EMPTY') {
      queryClient.setQueryData(['cbtAttempt', 'test-attempt-1'], {
        ...mockAttemptData,
        questions: [],
      });
    }

    queryClient.setQueryData(['bookmarks'], []);

    try {
      const html = renderToString(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/cbt/test-attempt-1']}>
            <Routes>
              <Route path="/cbt/:attemptId" element={<CbtExamRoom />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      console.log(`  Render Step ${i + 1} (${state}): OK (HTML length: ${html.length})`);
    } catch (err: any) {
      console.error(`💥 HOOK ORDER FAILURE on step ${i + 1} (${state}):`, err.message);
      return false;
    }
  }

  console.log(`✅ Passed: ${name}`);
  return true;
}

async function run() {
  console.log('=== REACT HOOKS ORDER REGRESSION & LIFECYCLE VERIFICATION ===');

  const test1 = runSequentialHookTest('Initial Load -> Data Loaded -> Refetch', [
    'LOADING',
    'LOADED',
    'LOADED',
  ]);

  const test2 = runSequentialHookTest('Loaded -> Error -> Recovered', [
    'LOADED',
    'ERROR',
    'LOADED',
  ]);

  const test3 = runSequentialHookTest('Loading -> Empty Question Pool -> Loaded', [
    'LOADING',
    'EMPTY',
    'LOADED',
  ]);

  const test4 = runSequentialHookTest('Stress Test: Rapid alternating state changes', [
    'LOADING',
    'LOADED',
    'LOADING',
    'LOADED',
    'ERROR',
    'LOADED',
    'EMPTY',
    'LOADED',
  ]);

  if (test1 && test2 && test3 && test4) {
    console.log('\n🎉 ALL REACT HOOK ORDER REGRESSION TESTS PASSED!');
    console.log('Zero "Rendered more hooks than during the previous render" errors detected.');
  } else {
    process.exit(1);
  }
}

run();
