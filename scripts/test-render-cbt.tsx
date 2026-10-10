import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CbtExamRoom } from '../src/components/CbtExamRoom.js';
import { ErrorBoundary } from '../src/components/ErrorBoundary.js';

function testCase(name: string, data: any) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(['cbtAttempt', 'test-id'], data);
  queryClient.setQueryData(['bookmarks'], []);

  try {
    const html = renderToString(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/cbt/test-id']}>
          <Routes>
            <Route
              path="/cbt/:attemptId"
              element={<CbtExamRoom />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    if (html.includes('Examination Session Error')) {
      console.log(`❌ TEST [${name}]: FAILED (ErrorBoundary caught crash)`);
      return false;
    } else {
      console.log(`✅ TEST [${name}]: PASSED`);
      return true;
    }
  } catch (err: any) {
    console.log(`💥 TEST [${name}]: FATAL ERROR:`, err.message);
    return false;
  }
}

async function main() {
  console.log('--- Running Edge Case Render Tests ---');

  // Case 1: answers is undefined
  testCase('answers is undefined', {
    attemptId: 'test-id',
    status: 'IN_PROGRESS',
    allocatedDurationSeconds: 1800,
    remainingSeconds: 1800,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 1800000).toISOString(),
    examName: 'JAMB',
    examShortCode: 'JAMB',
    subjectName: 'Math',
    subjectCode: 'MTH',
    questions: [
      {
        _id: 'q1',
        year: 2024,
        questionNumber: 1,
        questionText: 'What is 2+2?',
        optionA: '4',
        optionB: '3',
        optionC: '2',
        optionD: '1',
        difficulty: 'EASY',
      },
    ],
    // answers is missing!
  });

  // Case 2: subjectId is an Object instead of string
  testCase('subjectId is object', {
    attemptId: 'test-id',
    status: 'IN_PROGRESS',
    allocatedDurationSeconds: 1800,
    remainingSeconds: 1800,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 1800000).toISOString(),
    examName: 'JAMB',
    examShortCode: 'JAMB',
    subjectName: 'Math',
    subjectCode: 'MTH',
    questions: [
      {
        _id: 'q1',
        year: 2024,
        questionNumber: 1,
        questionText: 'What is 2+2?',
        optionA: '4',
        optionB: '3',
        optionC: '2',
        optionD: '1',
        difficulty: 'EASY',
        subjectId: { _id: 'sub1', name: 'Math' },
      },
    ],
    answers: [],
  });

  // Case 3: topicName is an Object instead of string
  testCase('topicName is object', {
    attemptId: 'test-id',
    status: 'IN_PROGRESS',
    allocatedDurationSeconds: 1800,
    remainingSeconds: 1800,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 1800000).toISOString(),
    examName: 'JAMB',
    examShortCode: 'JAMB',
    subjectName: 'Math',
    subjectCode: 'MTH',
    questions: [
      {
        _id: 'q1',
        year: 2024,
        questionNumber: 1,
        questionText: 'What is 2+2?',
        optionA: '4',
        optionB: '3',
        optionC: '2',
        optionD: '1',
        difficulty: 'EASY',
        topicName: { _id: 'top1', name: 'Arithmetic' },
      },
    ],
    answers: [],
  });

  // Case 4: subjectName is an Object instead of string
  testCase('subjectName is object', {
    attemptId: 'test-id',
    status: 'IN_PROGRESS',
    allocatedDurationSeconds: 1800,
    remainingSeconds: 1800,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 1800000).toISOString(),
    examName: 'JAMB',
    examShortCode: 'JAMB',
    subjectName: { name: 'Math' },
    subjectCode: 'MTH',
    questions: [
      {
        _id: 'q1',
        year: 2024,
        questionNumber: 1,
        questionText: 'What is 2+2?',
        optionA: '4',
        optionB: '3',
        optionC: '2',
        optionD: '1',
        difficulty: 'EASY',
        subjectName: { name: 'Math' },
      },
    ],
    answers: [],
  });

  // Case 5: answers array contains item with undefined questionId or object questionId
  testCase('answer questionId is object', {
    attemptId: 'test-id',
    status: 'IN_PROGRESS',
    allocatedDurationSeconds: 1800,
    remainingSeconds: 1800,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 1800000).toISOString(),
    examName: 'JAMB',
    examShortCode: 'JAMB',
    subjectName: 'Math',
    subjectCode: 'MTH',
    questions: [
      {
        _id: 'q1',
        year: 2024,
        questionNumber: 1,
        questionText: 'What is 2+2?',
        optionA: '4',
        optionB: '3',
        optionC: '2',
        optionD: '1',
        difficulty: 'EASY',
      },
    ],
    answers: [
      {
        questionId: { _id: 'q1' },
        selectedOption: 'A',
      },
    ],
  });

  // Case 6: questions is empty array []
  testCase('questions is empty', {
    attemptId: 'test-id',
    status: 'IN_PROGRESS',
    allocatedDurationSeconds: 1800,
    remainingSeconds: 1800,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 1800000).toISOString(),
    examName: 'JAMB',
    examShortCode: 'JAMB',
    subjectName: 'Math',
    subjectCode: 'MTH',
    questions: [],
    answers: [],
  });

  // Case 7: attemptData is completely undefined (loading failed)
  testCase('attemptData is undefined', undefined);
}

main().catch(console.error);
