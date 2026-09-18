import React from 'react';

export const Testimonial: React.FC = () => {
  return (
    <div className="testimonial">
      <div className="wrap">
        <span className="quote-mark" aria-hidden="true">"</span>
        <div>
          <blockquote>
            I went from guessing in mock JAMB to knowing exactly which topics were costing me marks. Three CBT mocks later I was scoring within range of my target.
          </blockquote>
          <cite>ADAOBI N. — SS3 STUDENT, LAGOS, PREPARING FOR JAMB/UTME</cite>
        </div>
      </div>
    </div>
  );
};
