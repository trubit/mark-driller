import React from 'react';
import { Hero } from './Hero.js';
import { GaugeStrip } from './GaugeStrip.js';
import { ExamBoards } from './ExamBoards.js';
import { Features } from './Features.js';
import { CbtPracticeSection } from './CbtPracticeSection.js';
import { PastQuestionsExplorer } from './PastQuestionsExplorer.js';
import { MockExamSection } from './MockExamSection.js';
import { StudyMaterialsSection } from './StudyMaterialsSection.js';
import { StudentProgressSection } from './StudentProgressSection.js';
import { SubscriptionTiersPreview } from './SubscriptionTiersPreview.js';
import { HowItWorks } from './HowItWorks.js';
import { Testimonial } from './Testimonial.js';
import { FaqSection } from './FaqSection.js';
import { SupportSection } from './SupportSection.js';
import { CtaBanner } from './CtaBanner.js';

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-page-root">
      <main>
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. Operational Metrics Gauge Strip */}
        <GaugeStrip />

        {/* 3. Examination Selection (6 Statutory Examination Cards) */}
        <ExamBoards />

        {/* 4. Learning Features Suite */}
        <Features />

        {/* 5. Full-Fidelity CBT Simulator (8-Key Navigation & Calculator) */}
        <CbtPracticeSection />

        {/* 6. Past Questions Bank Explorer with Worked Explanations */}
        <PastQuestionsExplorer />

        {/* 7. Timed Mock Examinations Suite */}
        <MockExamSection />

        {/* 8. Syllabus-Aligned Study Materials & Literature Novels */}
        <StudyMaterialsSection />

        {/* 9. Student Progress & Diagnostic Analytics */}
        <StudentProgressSection />

        {/* 10. Subscription Tiers & Scratch Card Activation */}
        <SubscriptionTiersPreview />

        {/* 11. How It Works Step Progression */}
        <HowItWorks />

        {/* 12. Verified Nigerian Student Testimonials */}
        <Testimonial />

        {/* 13. Frequently Asked Questions Accordion */}
        <FaqSection />

        {/* 14. Customer & Institutional Support Channels */}
        <SupportSection />

        {/* 15. Final Call-to-Action Banner */}
        <CtaBanner />
      </main>
    </div>
  );
};

