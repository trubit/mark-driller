import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client.js';

interface NigerianSchool {
  id: string;
  name: string;
  shortCode: string;
  type: 'FEDERAL_UNI' | 'STATE_UNI' | 'PRIVATE_UNI' | 'POLYTECHNIC';
  state: string;
  founded: number;
  minJambCutoff: number;
  popularCourses: string[];
  facultiesCount: number;
  website: string;
  admissionNote: string;
}

const NIGERIAN_TERTIARY_INSTITUTIONS: NigerianSchool[] = [
  {
    id: 'unilag',
    name: 'University of Lagos',
    shortCode: 'UNILAG',
    type: 'FEDERAL_UNI',
    state: 'Lagos',
    founded: 1962,
    minJambCutoff: 200,
    popularCourses: ['Medicine and Surgery', 'Law', 'Computer Science', 'Accounting', 'Mechanical Engineering', 'Pharmacy'],
    facultiesCount: 12,
    website: 'https://unilag.edu.ng',
    admissionNote: 'Strictly merit-driven aggregate (50% JAMB + 30% Post-UTME + 20% O\'Level). First-choice candidates only.',
  },
  {
    id: 'ui',
    name: 'University of Ibadan',
    shortCode: 'UI',
    type: 'FEDERAL_UNI',
    state: 'Oyo',
    founded: 1948,
    minJambCutoff: 200,
    popularCourses: ['Medicine and Surgery', 'Pharmacy', 'Law', 'Agricultural Science', 'Veterinary Medicine', 'English'],
    facultiesCount: 16,
    website: 'https://ui.edu.ng',
    admissionNote: 'Nigeria\'s premier university. Minimum 50% score in central Post-UTME screening required for merit admission list.',
  },
  {
    id: 'oau',
    name: 'Obafemi Awolowo University',
    shortCode: 'OAU',
    type: 'FEDERAL_UNI',
    state: 'Osun',
    founded: 1961,
    minJambCutoff: 200,
    popularCourses: ['Medicine and Surgery', 'Law', 'Computer Engineering', 'Pharmacy', 'Nursing Science', 'Architecture'],
    facultiesCount: 13,
    website: 'https://oauife.edu.ng',
    admissionNote: 'Strict catchment and merit quotas. No admission for candidates with deficient O\'Level grades in core prerequisites.',
  },
  {
    id: 'abu',
    name: 'Ahmadu Bello University',
    shortCode: 'ABU',
    type: 'FEDERAL_UNI',
    state: 'Kaduna',
    founded: 1962,
    minJambCutoff: 180,
    popularCourses: ['Medicine', 'Civil Engineering', 'Law', 'Veterinary Medicine', 'Business Administration', 'Architecture'],
    facultiesCount: 17,
    website: 'https://abu.edu.ng',
    admissionNote: 'Largest federal university in Sub-Saharan Africa. Diverse faculty offerings across main Samaru and Kongo campuses.',
  },
  {
    id: 'unn',
    name: 'University of Nigeria, Nsukka',
    shortCode: 'UNN',
    type: 'FEDERAL_UNI',
    state: 'Enugu',
    founded: 1960,
    minJambCutoff: 200,
    popularCourses: ['Medicine and Surgery', 'Pharmacy', 'Law', 'Electronic Engineering', 'Accountancy', 'Microbiology'],
    facultiesCount: 15,
    website: 'https://unn.edu.ng',
    admissionNote: 'Comprehensive federal collegiate institution with major campuses in Nsukka and Enugu (UNEC).',
  },
  {
    id: 'uniben',
    name: 'University of Benin',
    shortCode: 'UNIBEN',
    type: 'FEDERAL_UNI',
    state: 'Edo',
    founded: 1970,
    minJambCutoff: 200,
    popularCourses: ['Medicine and Surgery', 'Law', 'Petroleum Engineering', 'Dentistry', 'Economics', 'Biochemistry'],
    facultiesCount: 14,
    website: 'https://uniben.edu.ng',
    admissionNote: 'Rigorous PUTME computer-based examination. First choice institutional priority enforced.',
  },
  {
    id: 'lasu',
    name: 'Lagos State University',
    shortCode: 'LASU',
    type: 'STATE_UNI',
    state: 'Lagos',
    founded: 1983,
    minJambCutoff: 195,
    popularCourses: ['Law', 'Communication and Media Studies', 'Medicine', 'Computer Science', 'Public Administration'],
    facultiesCount: 11,
    website: 'https://lasu.edu.ng',
    admissionNote: 'Premier state university in Nigeria. Point-based screening calculator weighted by O\'Level sitting and grades.',
  },
  {
    id: 'covenant',
    name: 'Covenant University',
    shortCode: 'CU',
    type: 'PRIVATE_UNI',
    state: 'Ogun',
    founded: 2002,
    minJambCutoff: 200,
    popularCourses: ['Computer Engineering', 'Economics', 'Accounting', 'Electrical Electronics', 'Information Technology'],
    facultiesCount: 4,
    website: 'https://covenantuniversity.edu.ng',
    admissionNote: 'Top-ranked private university in Nigeria. Requires CUSAS scholastic aptitude test and character review.',
  },
  {
    id: 'yabatech',
    name: 'Yaba College of Technology',
    shortCode: 'YABATECH',
    type: 'POLYTECHNIC',
    state: 'Lagos',
    founded: 1947,
    minJambCutoff: 150,
    popularCourses: ['Computer Science', 'Civil Engineering', 'Electrical Engineering', 'Art and Industrial Design', 'Science Lab Tech'],
    facultiesCount: 8,
    website: 'https://yabatech.edu.ng',
    admissionNote: 'Nigeria\'s first higher education institution. Accredited ND and HND engineering and technical diplomas.',
  },
];

export const SchoolFinder: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedState, setSelectedState] = useState<string>('ALL');

  const { data: remoteData } = useQuery({
    queryKey: ['institutions', selectedType, selectedState, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedType !== 'ALL') params.set('type', selectedType);
      if (selectedState !== 'ALL') params.set('state', selectedState);
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', '100');
      return apiClient<{ institutions: NigerianSchool[] }>(`/api/institutions?${params.toString()}`);
    },
    staleTime: 60000,
  });

  const availableSchools = remoteData?.institutions && remoteData.institutions.length > 0
    ? remoteData.institutions
    : NIGERIAN_TERTIARY_INSTITUTIONS;

  const states = Array.from(new Set(availableSchools.map((s) => s.state))).sort();

  const filteredSchools = availableSchools.filter((school) => {
    const matchesQuery =
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.popularCourses.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'ALL' || school.type === selectedType;
    const matchesState = selectedState === 'ALL' || school.state === selectedState;

    return matchesQuery && matchesType && matchesState;
  });

  return (
    <div className="portal-layout premium-portal-page premium-learning-page" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <div className="wrap" style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <span className="eyebrow" style={{ margin: 0 }}>Tertiary Institution Directory</span>
          <h1 style={{ fontSize: '28px', color: 'var(--ink)', margin: '6px 0' }}>
            Nigerian School &amp; Institution Finder
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '750px', margin: 0 }}>
            Browse accredited Federal, State, and Private Universities and Polytechnics. Check verified JAMB cut-off benchmarks, popular courses, and admission screening guidelines.
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            background: 'var(--white)',
            border: '1px solid var(--paper-line)',
            borderRadius: '6px',
            padding: '18px 20px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <input
            type="text"
            placeholder="Search institution by name, acronym, or course (e.g. UNILAG, Pharmacy, Medicine, YABATECH)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--paper-line)',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'All Institutions', val: 'ALL' },
                { label: 'Federal Universities', val: 'FEDERAL_UNI' },
                { label: 'State Universities', val: 'STATE_UNI' },
                { label: 'Private Universities', val: 'PRIVATE_UNI' },
                { label: 'Polytechnics', val: 'POLYTECHNIC' },
              ].map((t) => (
                <button
                  key={t.val}
                  type="button"
                  onClick={() => setSelectedType(t.val)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: "var(--font-sans)",
                    fontWeight: 600,
                    border: selectedType === t.val ? '1px solid var(--rust)' : '1px solid var(--paper-line)',
                    background: selectedType === t.val ? 'var(--rust)' : 'var(--paper)',
                    color: selectedType === t.val ? '#ffffff' : 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                State:
              </span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--paper-line)',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  background: 'var(--paper)',
                }}
              >
                <option value="ALL">All States</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s} State
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div style={{ marginBottom: '16px', fontFamily: "var(--font-sans)", fontSize: '12.5px', color: 'var(--ink-soft)' }}>
          Found {filteredSchools.length} verified Nigerian institutions
        </div>

        {/* School Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredSchools.map((school) => (
            <div
              key={school.id}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--paper-line)',
                borderRadius: '6px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: '18px', color: 'var(--ink)' }}>
                    {school.shortCode}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      background: 'var(--paper)',
                      color: 'var(--rust)',
                      fontWeight: 600,
                    }}
                  >
                    Est. {school.founded}
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', margin: '0 0 6px 0', color: 'var(--ink)', fontWeight: 600 }}>
                  {school.name}
                </h3>

                <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)', marginBottom: '14px' }}>
                  📍 {school.state} State &nbsp;•&nbsp; {school.facultiesCount} Faculties / Colleges
                </div>

                {/* Metrics Box */}
                <div
                  style={{
                    background: 'var(--paper)',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                    border: '1px solid var(--paper-line)',
                  }}
                >
                  <div>
                    <span style={{ display: 'block', fontSize: '10px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                      MIN JAMB BENCHMARK
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--rust)', fontFamily: "var(--font-sans)" }}>
                      {school.minJambCutoff} Points
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '10px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                      CATEGORY
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', fontFamily: "var(--font-sans)" }}>
                      {school.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Popular Courses */}
                <div style={{ marginBottom: '14px' }}>
                  <span className="eyebrow" style={{ fontSize: '10px' }}>Key Accredited Courses</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {school.popularCourses.map((course, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'var(--paper-dim)',
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          color: 'var(--ink)',
                        }}
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: 1.4, marginBottom: '14px' }}>
                  <strong>Admission Guide:</strong> {school.admissionNote}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--paper-line)' }}>
                <button
                  type="button"
                  className="btn-custom btn-custom-primary"
                  onClick={() => navigate('/portal/post-utme')}
                  style={{ flex: 1, padding: '7px 12px', fontSize: '12px', textAlign: 'center' }}
                >
                  Post-UTME Drill →
                </button>
                <a
                  href={school.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-custom btn-custom-ghost"
                  style={{ padding: '7px 12px', fontSize: '12px' }}
                >
                  Portal ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

