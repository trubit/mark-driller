import React from 'react';
import { Navbar } from './Navbar.js';
import { Hero } from './Hero.js';
import { GaugeStrip } from './GaugeStrip.js';
import { Features } from './Features.js';
import { ExamBoards } from './ExamBoards.js';
import { HowItWorks } from './HowItWorks.js';
import { Testimonial } from './Testimonial.js';
import { CtaBanner } from './CtaBanner.js';
import { Footer } from './Footer.js';
import { AuthModal } from './AuthModal.js';

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-page-root">
      <Navbar />
      <main>
        <Hero />
        <GaugeStrip />
        <Features />
        <ExamBoards />
        <HowItWorks />
        <Testimonial />
        <CtaBanner />
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
};
