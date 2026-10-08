import React from 'react';
import { Hero } from './Hero.js';
import { WhatWeOffer } from './WhatWeOffer.js';
import { ExamBoards } from './ExamBoards.js';
import { HowItWorks } from './HowItWorks.js';
import { ExamExperience } from './ExamExperience.js';
import { StudentProgressSection } from './StudentProgressSection.js';
import { CtaBanner } from './CtaBanner.js';

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-page-root">
      <main>
        {/* Section 1: Full-Width Hero with Edge-to-Edge Image, Overlaid Nav/Search/CTAs */}
        <Hero />

        {/* Section 2: What MarkDriller Offers — 6 Core Examination Capabilities */}
        <WhatWeOffer />

        {/* Section 3: Statutory Nigerian Examination Boards (JAMB, WAEC, NECO, GCE, Post-UTME, NABTEB) */}
        <ExamBoards />

        {/* Section 4: Simple 5-Step Workflow from Target Selection to Performance Review */}
        <HowItWorks />

        {/* Section 5: Learning & CBT Exam Experience (Interactive Hall Simulation Terminal) */}
        <ExamExperience />

        {/* Section 6: Performance Intelligence & Diagnostic Growth Analytics */}
        <StudentProgressSection />

        {/* Section 7: High-Impact Conversion Action */}
        <CtaBanner />
      </main>
    </div>
  );
};

export default LandingPage;
