import React, { useState } from 'react';

interface CareerProfile {
  id: string;
  field: 'HEALTH_SCIENCES' | 'ENGINEERING_TECH' | 'LAW_HUMANITIES' | 'MANAGEMENT_SOCIAL' | 'ENVIRONMENTAL';
  title: string;
  degreeCourse: string;
  utmeSubjects: string[];
  oLevelRequirements: string;
  description: string;
  leadingInstitutions: string[];
  keyCompetencies: string[];
}

const CAREER_PROFILES: CareerProfile[] = [
  {
    id: 'med',
    field: 'HEALTH_SCIENCES',
    title: 'Medical Doctor / Surgeon',
    degreeCourse: 'Medicine and Surgery (MBBS)',
    utmeSubjects: ['Use of English (Compulsory)', 'Biology', 'Chemistry', 'Physics'],
    oLevelRequirements: 'Five (5) SSCE credit passes in English Language, Mathematics, Physics, Chemistry and Biology at ONE sitting in WAEC, NECO, or GCE.',
    description: 'Diagnoses and treats illnesses, injuries, and medical disorders; provides preventive health counsel and performs clinical procedures.',
    leadingInstitutions: ['University of Ibadan (UI)', 'University of Lagos (UNILAG)', 'Ahmadu Bello University (ABU)', 'University of Nigeria (UNN)', 'Obafemi Awolowo University (OAU)'],
    keyCompetencies: ['Clinical Diagnostics', 'Biochemical Pathology', 'Anatomy', 'Pharmacology', 'Patient Communication'],
  },
  {
    id: 'swe',
    field: 'ENGINEERING_TECH',
    title: 'Software Engineer / Systems Architect',
    degreeCourse: 'Computer Science / Computer Engineering',
    utmeSubjects: ['Use of English (Compulsory)', 'Mathematics', 'Physics', 'Chemistry or Further Mathematics'],
    oLevelRequirements: 'Five (5) SSCE credit passes in English Language, Mathematics, Physics, Chemistry and one other Science subject.',
    description: 'Designs, develops, tests, and maintains software applications, operating systems, network protocols, and distributed cloud services.',
    leadingInstitutions: ['UNILAG', 'Covenant University', 'Federal University of Technology Akure (FUTA)', 'OAU', 'University of Ilorin (UNILORIN)'],
    keyCompetencies: ['Algorithms & Data Structures', 'Software Design Patterns', 'Database Systems', 'Network Engineering'],
  },
  {
    id: 'law',
    field: 'LAW_HUMANITIES',
    title: 'Barrister & Solicitor / Legal Counsel',
    degreeCourse: 'Law (LL.B)',
    utmeSubjects: ['Use of English (Compulsory)', 'Literature in English', 'Government or History', 'Any Arts or Social Science subject'],
    oLevelRequirements: 'Five (5) SSCE credit passes including English Language, Literature in English, Mathematics and any other two Arts/Social Science subjects.',
    description: 'Advises individuals, businesses, and government bodies on legal rights and responsibilities; represents clients in court arbitration and litigation.',
    leadingInstitutions: ['University of Lagos (UNILAG)', 'University of Ibadan (UI)', 'Obafemi Awolowo University (OAU)', 'University of Nigeria (UNN)', 'Lagos State University (LASU)'],
    keyCompetencies: ['Constitutional Law', 'Legal Drafting & Advocacy', 'Jurisprudence', 'Critical Dispute Analysis'],
  },
  {
    id: 'eng-mech',
    field: 'ENGINEERING_TECH',
    title: 'Mechanical / Production Engineer',
    degreeCourse: 'Mechanical Engineering (B.Eng / B.Sc)',
    utmeSubjects: ['Use of English (Compulsory)', 'Mathematics', 'Physics', 'Chemistry'],
    oLevelRequirements: 'Five (5) SSCE credit passes in Mathematics, Physics, Chemistry, English Language and any other science or technical drawing subject.',
    description: 'Designs, evaluates, and manufactures mechanical systems, engines, industrial machines, and thermal energy systems.',
    leadingInstitutions: ['UNILAG', 'ABU Zaria', 'University of Benin (UNIBEN)', 'Federal University of Technology Minna (FUTMINNA)'],
    keyCompetencies: ['Thermodynamics', 'Fluid Mechanics', 'Solid Mechanics', 'CAD / CAM Drafting', 'Robotics'],
  },
  {
    id: 'pharm',
    field: 'HEALTH_SCIENCES',
    title: 'Pharmacist / Clinical Toxicologist',
    degreeCourse: 'Pharmacy (Pharm.D / B.Pharm)',
    utmeSubjects: ['Use of English (Compulsory)', 'Chemistry', 'Biology', 'Physics'],
    oLevelRequirements: 'Five (5) SSCE credit passes in English Language, Mathematics, Physics, Chemistry and Biology.',
    description: 'Compounds and dispenses prescribed medications; reviews medication safety, dosage interactions, and drug therapeutic outcomes.',
    leadingInstitutions: ['Obafemi Awolowo University (OAU)', 'University of Ibadan (UI)', 'University of Benin (UNIBEN)', 'UNILAG'],
    keyCompetencies: ['Medicinal Chemistry', 'Pharmaceutics', 'Pharmacokinetics', 'Toxicology'],
  },
  {
    id: 'acc',
    field: 'MANAGEMENT_SOCIAL',
    title: 'Chartered Accountant / Financial Analyst',
    degreeCourse: 'Accounting (B.Sc)',
    utmeSubjects: ['Use of English (Compulsory)', 'Mathematics', 'Economics', 'Any Social Science or Commercial Subject'],
    oLevelRequirements: 'Five (5) SSCE credit passes including English Language, Mathematics, Economics, Financial Accounting/Commerce and any other subject.',
    description: 'Manages financial records, audit verifications, taxation compliance, budget forecasting, and corporate financial controls.',
    leadingInstitutions: ['University of Lagos (UNILAG)', 'University of Benin (UNIBEN)', 'Covenant University', 'OAU'],
    keyCompetencies: ['Financial Auditing (ICAN/ACCA)', 'Corporate Taxation', 'Cost Accounting', 'Financial Modeling'],
  },
  {
    id: 'arch',
    field: 'ENVIRONMENTAL',
    title: 'Architect / Urban Master Planner',
    degreeCourse: 'Architecture (B.Sc / M.Sc)',
    utmeSubjects: ['Use of English (Compulsory)', 'Physics', 'Mathematics', 'Technical Drawing, Chemistry, or Geography'],
    oLevelRequirements: 'Five (5) SSCE credit passes in English Language, Mathematics, Physics and any two of Technical Drawing, Chemistry, Geography, Economics.',
    description: 'Plans and designs aesthetic, functional, and structurally sound residential, commercial, and urban built environments.',
    leadingInstitutions: ['Ahmadu Bello University (ABU Zaria)', 'UNILAG', 'FUTA', 'Covenant University'],
    keyCompetencies: ['Architectural Draughtsmanship', 'BIM Modeling', 'Building Structures', 'Environmental Sustainability'],
  },
  {
    id: 'nurs',
    field: 'HEALTH_SCIENCES',
    title: 'Registered Nurse / Nurse Practitioner',
    degreeCourse: 'Nursing Science (B.N.Sc)',
    utmeSubjects: ['Use of English (Compulsory)', 'Physics', 'Chemistry', 'Biology'],
    oLevelRequirements: 'Five (5) SSCE credit passes in English Language, Mathematics, Physics, Chemistry and Biology at not more than two sittings.',
    description: 'Provides holistic direct patient care, administers clinical treatments, monitors vital recovery parameters, and coordinates primary healthcare.',
    leadingInstitutions: ['University of Ibadan (UI)', 'OAU Ile-Ife', 'UNN Nsukka', 'UNILORIN'],
    keyCompetencies: ['Critical Care Nursing', 'Medical Surgical Nursing', 'Patient Advocacy', 'Pharmacotherapeutics'],
  },
];

export const CareerGuide: React.FC = () => {
  const [selectedField, setSelectedField] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredCareers = CAREER_PROFILES.filter((c) => {
    const matchesField = selectedField === 'ALL' || c.field === selectedField;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.degreeCourse.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.utmeSubjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.leadingInstitutions.some((inst) => inst.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesField && matchesSearch;
  });

  return (
    <div className="portal-layout premium-portal-page premium-learning-page" style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <div className="wrap" style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <span className="eyebrow" style={{ margin: 0 }}>Official JAMB Brochure Reference</span>
          <h1 style={{ fontSize: '28px', color: 'var(--ink)', margin: '6px 0' }}>
            Nigerian Career &amp; Subject Combination Guide
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '15px', maxWidth: '750px', margin: 0 }}>
            Ensure your 4-subject JAMB UTME combination and 5-credit O\'Level profile strictly adhere to official Nigerian university matriculation regulations before sitting for your examination.
          </p>
        </div>

        {/* Filter and Search */}
        <div
          style={{
            background: 'var(--white)',
            border: '1px solid var(--paper-line)',
            borderRadius: '6px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <input
            type="text"
            placeholder="Search by career, degree course, or subject (e.g. Medicine, Law, Physics, Mathematics)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '260px',
              padding: '8px 12px',
              border: '1px solid var(--paper-line)',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { label: 'All Disciplines', val: 'ALL' },
              { label: 'Health Sciences', val: 'HEALTH_SCIENCES' },
              { label: 'Engineering & Tech', val: 'ENGINEERING_TECH' },
              { label: 'Law & Humanities', val: 'LAW_HUMANITIES' },
              { label: 'Management', val: 'MANAGEMENT_SOCIAL' },
              { label: 'Environmental', val: 'ENVIRONMENTAL' },
            ].map((f) => (
              <button
                key={f.val}
                type="button"
                onClick={() => setSelectedField(f.val)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  border: selectedField === f.val ? '1px solid var(--rust)' : '1px solid var(--paper-line)',
                  background: selectedField === f.val ? 'var(--rust)' : 'var(--paper)',
                  color: selectedField === f.val ? '#ffffff' : 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Career Profiles Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredCareers.map((career) => (
            <div
              key={career.id}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--paper-line)',
                borderTop: '4px solid var(--rust)',
                borderRadius: '6px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: '10.5px',
                    color: 'var(--rust)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  {career.degreeCourse}
                </span>

                <h3 style={{ fontSize: '20px', margin: '4px 0 8px 0', color: 'var(--ink)' }}>
                  {career.title}
                </h3>

                <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: '16px' }}>
                  {career.description}
                </p>

                {/* Mandatory JAMB 4-Subject Combination Box */}
                <div
                  style={{
                    background: 'var(--paper)',
                    padding: '12px 14px',
                    borderRadius: '4px',
                    border: '1px solid var(--paper-line)',
                    marginBottom: '14px',
                  }}
                >
                  <span className="eyebrow" style={{ fontSize: '10px' }}>Mandatory JAMB UTME Subject Combination</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {career.utmeSubjects.map((subj, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'var(--white)',
                          padding: '3px 8px',
                          borderRadius: '3px',
                          fontSize: '12px',
                          fontFamily: "var(--font-sans)",
                          fontWeight: 600,
                          color: 'var(--ink)',
                          border: '1px solid var(--paper-line)',
                        }}
                      >
                        ✓ {subj}
                      </span>
                    ))}
                  </div>
                </div>

                {/* O'Level Prerequisite */}
                <div style={{ marginBottom: '14px' }}>
                  <span className="eyebrow" style={{ fontSize: '10px' }}>WAEC / NECO / GCE O'Level Requirement</span>
                  <p style={{ fontSize: '12.5px', color: 'var(--ink)', lineHeight: 1.4, margin: '4px 0 0 0' }}>
                    {career.oLevelRequirements}
                  </p>
                </div>

                {/* Leading Institutions */}
                <div>
                  <span className="eyebrow" style={{ fontSize: '10px' }}>Benchmark Nigerian Institutions</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {career.leadingInstitutions.map((inst, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'var(--paper-dim)',
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          color: 'var(--ink-soft)',
                        }}
                      >
                        {inst}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: '18px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--paper-line)',
                  fontSize: '11.5px',
                  color: 'var(--ink-soft)',
                  fontFamily: "var(--font-sans)",
                }}
              >
                Derived from official JAMB UTME Brochure standards
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

