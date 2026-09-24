import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';

interface TestimonialItem {
  studentName?: string;
  name?: string;
  score?: string;
  universityAdmitted?: string;
  school?: string;
  admission?: string;
  avatarUrl?: string;
  image?: string;
  quote: string;
}

export const Testimonial: React.FC = () => {
  const { data: remoteTestimonials } = useQuery<TestimonialItem[]>({
    queryKey: ['testimonials'],
    queryFn: () => apiClient<TestimonialItem[]>('/api/testimonials'),
    staleTime: 60000,
  });

  const testimonials = remoteTestimonials && remoteTestimonials.length > 0
    ? remoteTestimonials.map((item) => ({
        name: item.studentName || item.name || 'Verified learner',
        score: item.score,
        school: item.school,
        admission: item.universityAdmitted || item.admission,
        image: item.avatarUrl || item.image,
        quote: item.quote,
      }))
    : [];

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="testimonial" aria-label="Verified student stories">
      <div className="wrap" style={{ padding: '80px 32px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
          <span className="eyebrow" style={{ color: 'var(--amber)' }}>
            Student outcomes
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', color: '#ffffff', marginTop: '8px' }}>
            Real stories from MarkDriller learners
          </h2>
          <p style={{ color: 'rgba(248, 247, 242, 0.75)', fontSize: '16px', marginTop: '10px' }}>
            Published only when a verified learner story is available from the platform.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
          {testimonials.map((item, index) => (
            <article
              key={`${item.name}-${index}`}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.68)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '13px',
                      color: 'var(--amber)',
                      backgroundColor: 'rgba(245, 158, 11, 0.14)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: '1px solid rgba(245, 158, 11, 0.28)',
                    }}
                  >
                    {item.score || 'Verified learner'}
                  </span>
                  {item.score && (
                    <span style={{ fontSize: '11px', color: 'rgba(248, 247, 242, 0.5)', fontWeight: 700 }}>
                      VERIFIED RESULT
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: 'rgba(248, 247, 242, 0.9)', fontStyle: 'italic', margin: '0 0 24px 0' }}>
                  "{item.quote}"
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--amber)',
                    }}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {item.name}
                  </h4>
                  <div style={{ fontSize: '12px', color: 'rgba(248, 247, 242, 0.7)', marginTop: '2px' }}>
                    {item.school || 'MarkDriller learner'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--amber)', fontWeight: 700, marginTop: '2px' }}>
                    {item.admission || 'Verified platform story'}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
