import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationStore } from '../store/useNotificationStore.js';

export interface DictionaryEntry {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'scientific term' | 'idiom';
  subject: 'ENGLISH_LEXIS' | 'MATHEMATICS' | 'PHYSICS' | 'CHEMISTRY' | 'BIOLOGY' | 'ECONOMICS' | 'GOVERNMENT';
  examBoardScope: string[];
  definition: string;
  syllabusContext: string;
  exampleSentence: string;
  synonyms?: string[];
  antonyms?: string[];
}

const ACADEMIC_DICTIONARY_DATA: DictionaryEntry[] = [
  // --- ENGLISH LEXIS & STRUCTURE (JAMB / WAEC CORE) ---
  {
    id: 'lex-ephemeral',
    word: 'Ephemeral',
    phonetic: '/ɪˈfem.ər.əl/',
    partOfSpeech: 'adjective',
    subject: 'ENGLISH_LEXIS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'Lasting for a very short duration; transitory; fleeting.',
    syllabusContext: 'Lexis & Structure — Vocabulary Associated with Time & Transience',
    exampleSentence: 'The candidate realized that political popularity in the polling ward was ephemeral without tangible grassroots projects.',
    synonyms: ['transient', 'evanescent', 'fleeting', 'short-lived'],
    antonyms: ['perpetual', 'eternal', 'enduring', 'permanent'],
  },
  {
    id: 'lex-ubiquitous',
    word: 'Ubiquitous',
    phonetic: '/juːˈbɪk.wɪ.təs/',
    partOfSpeech: 'adjective',
    subject: 'ENGLISH_LEXIS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'Present, appearing, or found everywhere simultaneously; omnipresent.',
    syllabusContext: 'Lexis & Structure — Advanced Descriptive Adjectives',
    exampleSentence: 'In contemporary Nigeria, mobile telecommunication has become ubiquitous even in remote agricultural settlements.',
    synonyms: ['omnipresent', 'pervasive', 'universal', 'widespread'],
    antonyms: ['rare', 'scarce', 'localized', 'uncommon'],
  },
  {
    id: 'lex-anomaly',
    word: 'Anomaly',
    phonetic: '/əˈnɒm.ə.li/',
    partOfSpeech: 'noun',
    subject: 'ENGLISH_LEXIS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'Something that deviates from what is standard, normal, or expected.',
    syllabusContext: 'Scientific & General Vocabulary in Comprehensive Passages',
    exampleSentence: 'The meteorologist observed a sudden temperature anomaly along the Niger-Benue confluence basin.',
    synonyms: ['aberration', 'irregularity', 'peculiarity', 'deviation'],
    antonyms: ['normality', 'conformity', 'regularity'],
  },
  {
    id: 'lex-surreptitious',
    word: 'Surreptitious',
    phonetic: '/ˌsʌr.əpˈtɪʃ.əs/',
    partOfSpeech: 'adjective',
    subject: 'ENGLISH_LEXIS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'Kept secret, especially because it would not be officially approved of; clandestine.',
    syllabusContext: 'Lexis & Structure — Vocabulary of Secrecy & Deception',
    exampleSentence: 'Invigilators disqualified the candidate who made surreptitious attempts to exchange answer booklets.',
    synonyms: ['clandestine', 'covert', 'furtive', 'stealthy'],
    antonyms: ['overt', 'transparent', 'candid', 'blatant'],
  },
  {
    id: 'lex-pragmatic',
    word: 'Pragmatic',
    phonetic: '/præɡˈmæt.ɪk/',
    partOfSpeech: 'adjective',
    subject: 'ENGLISH_LEXIS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'Dealing with matters sensibly and realistically based on practical rather than theoretical considerations.',
    syllabusContext: 'Lexis & Structure — Philosophy, Policy & Critical Decision-Making',
    exampleSentence: 'The commissioner adopted a pragmatic fiscal approach to complete lingering classroom construction projects.',
    synonyms: ['practical', 'matter-of-fact', 'realistic', 'sensible'],
    antonyms: ['idealistic', 'impractical', 'dogmatic', 'utopian'],
  },
  {
    id: 'lex-exonerate',
    word: 'Exonerate',
    phonetic: '/ɪɡˈzɒn.ə.reɪt/',
    partOfSpeech: 'verb',
    subject: 'ENGLISH_LEXIS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'To officially absolve someone from blame or fault for a wrongdoing or criminal charge.',
    syllabusContext: 'Register of Law, Courts & Judicial Proceedings',
    exampleSentence: 'Substantive forensic evidence presented at the High Court served to exonerate the accused storekeeper.',
    synonyms: ['absolve', 'acquit', 'vindicate', 'clear'],
    antonyms: ['convict', 'incriminate', 'implicate', 'censure'],
  },
  {
    id: 'lex-fastidious',
    word: 'Fastidious',
    phonetic: '/fæsˈtɪd.i.əs/',
    partOfSpeech: 'adjective',
    subject: 'ENGLISH_LEXIS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'Very attentive to and concerned about accuracy and detail; hard to please.',
    syllabusContext: 'Character & Personality Descriptions in Comprehension',
    exampleSentence: 'The chief examiner is exceptionally fastidious about proper essay paragraph indentation and punctuation.',
    synonyms: ['meticulous', 'scrupulous', 'punctilious', 'exacting'],
    antonyms: ['careless', 'lax', 'sloppy', 'negligent'],
  },
  {
    id: 'lex-ostentatious',
    word: 'Ostentatious',
    phonetic: '/ˌɒs.tenˈteɪ.ʃəs/',
    partOfSpeech: 'adjective',
    subject: 'ENGLISH_LEXIS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'Characterized by vulgar or pretentious display designed to impress or attract notice.',
    syllabusContext: 'Lexis & Structure — Antonyms and Nearest-in-Meaning',
    exampleSentence: 'His ostentatious lifestyle provoked public scrutiny when his official assets declaration was examined.',
    synonyms: ['flamboyant', 'pretentious', 'showy', 'gaudy'],
    antonyms: ['modest', 'unassuming', 'retiring', 'austere'],
  },
  {
    id: 'lex-recalcitrant',
    word: 'Recalcitrant',
    phonetic: '/rɪˈkæl.sɪ.trənt/',
    partOfSpeech: 'adjective',
    subject: 'ENGLISH_LEXIS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'Having an obstinately uncooperative attitude toward authority or discipline.',
    syllabusContext: 'Lexis & Structure — Behavioral Attributes',
    exampleSentence: 'The principal summoned the parents of recalcitrant prefects who continually defied curfew protocols.',
    synonyms: ['unruly', 'refractory', 'defiant', 'insubordinate'],
    antonyms: ['compliant', 'amenable', 'docile', 'tractable'],
  },
  {
    id: 'lex-cacophony',
    word: 'Cacophony',
    phonetic: '/kəˈkɒf.ə.ni/',
    partOfSpeech: 'noun',
    subject: 'ENGLISH_LEXIS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'A harsh, discordant mixture of sounds.',
    syllabusContext: 'Descriptive Writing & Sensory Terminology',
    exampleSentence: 'A cacophony of blaring vehicle horns and market vendors greeted travelers arriving at Oshodi bus terminal.',
    synonyms: ['dissonance', 'din', 'clamour', 'racket'],
    antonyms: ['harmony', 'euphony', 'symphony', 'melodiousness'],
  },

  // --- MATHEMATICS & CALCULUS ---
  {
    id: 'math-asymptote',
    word: 'Asymptote',
    phonetic: '/ˈæs.ɪm.toʊt/',
    partOfSpeech: 'scientific term',
    subject: 'MATHEMATICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'A straight line that a curve approaches arbitrarily closely as either the coordinates tend to infinity, but never intersects.',
    syllabusContext: 'Rational Functions & Coordinate Geometry',
    exampleSentence: 'For the hyperbolic curve y = 1/(x - 3), the vertical asymptote is given by the line x = 3.',
    synonyms: ['limiting line', 'boundary curve'],
  },
  {
    id: 'math-discriminant',
    word: 'Discriminant',
    phonetic: '/dɪˈskrɪm.ɪ.nənt/',
    partOfSpeech: 'scientific term',
    subject: 'MATHEMATICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The expression b² - 4ac in quadratic algebra that reveals the nature of the roots of ax² + bx + c = 0.',
    syllabusContext: 'Quadratic Equations & Polynomial Analysis',
    exampleSentence: 'When the discriminant is strictly negative (Δ < 0), the quadratic curve does not cross the horizontal x-axis and has complex conjugate roots.',
    synonyms: ['characteristic determinant'],
  },
  {
    id: 'math-derivative',
    word: 'Derivative',
    phonetic: '/dɪˈrɪv.ə.tɪv/',
    partOfSpeech: 'scientific term',
    subject: 'MATHEMATICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The instantaneous rate of change of a function with respect to one of its variables; dy/dx = lim(h→0) [f(x+h) - f(x)] / h.',
    syllabusContext: 'Differential Calculus & Kinematics',
    exampleSentence: 'Differentiating the displacement function s(t) = 4t³ - 2t with respect to time yields the velocity derivative v(t) = 12t² - 2.',
    synonyms: ['differential coefficient', 'rate of change', 'gradient function'],
  },
  {
    id: 'math-logarithm',
    word: 'Logarithm',
    phonetic: '/ˈlɒɡ.ə.rɪð.əm/',
    partOfSpeech: 'scientific term',
    subject: 'MATHEMATICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The exponent or power to which a specified base must be raised to produce a given number; log_b(y) = x implies b^x = y.',
    syllabusContext: 'Indices & Logarithmic Functions',
    exampleSentence: 'Using standard four-figure log tables, multiplication of multi-digit factors simplifies into additions of logarithms.',
    synonyms: ['power index', 'exponential inverse'],
  },
  {
    id: 'math-collinear',
    word: 'Collinear',
    phonetic: '/kəʊˈlɪn.i.ər/',
    partOfSpeech: 'adjective',
    subject: 'MATHEMATICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'Lying in or passing through the same straight line.',
    syllabusContext: 'Plane Geometry & Coordinate Geometry',
    exampleSentence: 'Three distinct coordinates A, B, and C are collinear if the gradient of AB equals the gradient of BC.',
    synonyms: ['co-linear', 'aligned'],
  },
  {
    id: 'math-histogram',
    word: 'Histogram',
    phonetic: '/ˈhɪs.tə.ɡræm/',
    partOfSpeech: 'scientific term',
    subject: 'MATHEMATICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'A continuous bar representation of grouped statistical data where area is proportional to class frequency.',
    syllabusContext: 'Statistics & Grouped Frequency Distributions',
    exampleSentence: 'The modal class of the candidates examination marks was estimated from the highest block of the statistical histogram.',
    synonyms: ['frequency bar chart'],
  },

  // --- PHYSICS & KINETICS ---
  {
    id: 'phy-viscosity',
    word: 'Viscosity',
    phonetic: '/vɪˈskɒs.ɪ.ti/',
    partOfSpeech: 'scientific term',
    subject: 'PHYSICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The internal resistance of a fluid to flow, resulting from intermolecular tangential frictional forces between adjacent fluid layers.',
    syllabusContext: 'Properties of Matter & Fluid Dynamics',
    exampleSentence: 'Engine oil possesses higher viscosity than kerosene, resulting in slower terminal velocities for falling metal spheres.',
    synonyms: ['fluid friction', 'internal resistance'],
  },
  {
    id: 'phy-diffraction',
    word: 'Diffraction',
    phonetic: '/dɪˈfræk.ʃən/',
    partOfSpeech: 'scientific term',
    subject: 'PHYSICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The bending or spreading of waves around the sharp edges of an obstacle or through an aperture comparable in size to the wavelength.',
    syllabusContext: 'Wave Optics & Sound Wave Phenomena',
    exampleSentence: 'Audio sound waves exhibit pronounced diffraction around doorways because their physical wavelengths match ordinary portal apertures.',
    synonyms: ['wave spreading', 'bending of light'],
  },
  {
    id: 'phy-inductance',
    word: 'Inductance',
    phonetic: '/ɪnˈdʌk.təns/',
    partOfSpeech: 'scientific term',
    subject: 'PHYSICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The property of an electrical conductor by which a change in current induces an electromotive force (EMF) opposing the change (Faraday-Lenz Law).',
    syllabusContext: 'Electromagnetism & AC Circuit Theory',
    exampleSentence: 'An iron-core inductor increases self-inductance measured in Henries (H), choking high-frequency alternating currents.',
    synonyms: ['electromagnetic self-induction'],
  },
  {
    id: 'phy-superconductivity',
    word: 'Superconductivity',
    phonetic: '/ˌsuː.pə.kɒn.dʌkˈtɪv.ə.ti/',
    partOfSpeech: 'scientific term',
    subject: 'PHYSICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The phenomenon whereby certain electrical conductors exhibit precisely zero electrical resistance below a critical transition temperature (Tc).',
    syllabusContext: 'Modern Physics & Conduction in Solids',
    exampleSentence: 'Liquid helium cooling allows specialized niobium alloys to achieve superconductivity, sustaining zero-loss persistent currents.',
    synonyms: ['zero electrical resistance'],
  },
  {
    id: 'phy-refraction',
    word: 'Refraction',
    phonetic: '/rɪˈfræk.ʃən/',
    partOfSpeech: 'scientific term',
    subject: 'PHYSICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The change in direction and speed of propagation of a wave as it passes obliquely from one optical medium into another with different density.',
    syllabusContext: 'Geometric Optics & Snell’s Law',
    exampleSentence: 'Snell’s law states that the ratio of the sine of the angle of incidence to the sine of refraction equals the refractive index n = sin(i)/sin(r).',
    synonyms: ['wave re-direction'],
  },
  {
    id: 'phy-capacitance',
    word: 'Capacitance',
    phonetic: '/kəˈpæs.ɪ.təns/',
    partOfSpeech: 'scientific term',
    subject: 'PHYSICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The ratio of the electrical charge stored on each conductor of a capacitor to the potential difference across them; C = Q/V (measured in Farads).',
    syllabusContext: 'Electrostatics & Electric Field Energy',
    exampleSentence: 'Inserting a dielectric slab of mica between capacitor plates multiplies overall capacitance by the relative permittivity factor.',
    synonyms: ['electric charge capacity'],
  },

  // --- CHEMISTRY & STOICHIOMETRY ---
  {
    id: 'chem-isomerism',
    word: 'Isomerism',
    phonetic: '/aɪˈsɒm.ər.ɪ.zəm/',
    partOfSpeech: 'scientific term',
    subject: 'CHEMISTRY',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The phenomenon whereby two or more distinct chemical compounds share identical molecular formulas but exhibit differing structural arrangements or spatial configurations.',
    syllabusContext: 'Organic Chemistry & Hydrocarbons',
    exampleSentence: 'Butane and 2-methylpropane are structural isomers that share the empirical formula C4H10 but have distinct boiling points.',
    synonyms: ['structural isomerism', 'stereoisomerism'],
  },
  {
    id: 'chem-stoichiometry',
    word: 'Stoichiometry',
    phonetic: '/ˌstɔɪ.kiˈɒm.ə.tri/',
    partOfSpeech: 'scientific term',
    subject: 'CHEMISTRY',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The quantitative relationship between reactants and products in a balanced chemical equation according to the law of conservation of mass.',
    syllabusContext: 'Mole Concept & Chemical Equations',
    exampleSentence: 'By stoichiometry, two moles of sodium hydroxide precisely neutralize one mole of sulfuric acid: 2NaOH + H2SO4 → Na2SO4 + 2H2O.',
    synonyms: ['mole proportion', 'chemical equivalence'],
  },
  {
    id: 'chem-electronegativity',
    word: 'Electronegativity',
    phonetic: '/ɪˌlek.trəʊˌneɡ.əˈtɪv.ə.ti/',
    partOfSpeech: 'scientific term',
    subject: 'CHEMISTRY',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The relative tendency or measure of the power of an atom in a molecule to attract shared bonding electrons toward itself.',
    syllabusContext: 'Periodic Trends & Chemical Bonding',
    exampleSentence: 'Fluorine holds the highest Pauling electronegativity value of 4.0, inducing strong bond dipoles in hydrogen fluoride molecules.',
    synonyms: ['electron affinity trend'],
  },
  {
    id: 'chem-allotropy',
    word: 'Allotropy',
    phonetic: '/əˈlɒt.rə.pi/',
    partOfSpeech: 'scientific term',
    subject: 'CHEMISTRY',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The existence of a chemical element in two or more differing physical forms in the same physical state (e.g., diamond and graphite for carbon).',
    syllabusContext: 'Non-Metals & Group IV Carbon Chemistry',
    exampleSentence: 'Diamond and graphite demonstrate allotropy; the tetrahedral covalent lattice of diamond makes it an abrasive insulator, while graphite conducts electricity.',
    synonyms: ['allotropic polymorphism'],
  },
  {
    id: 'chem-catalyst',
    word: 'Catalyst',
    phonetic: '/ˈkæt.əl.ɪst/',
    partOfSpeech: 'scientific term',
    subject: 'CHEMISTRY',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'A substance that accelerates the rate of a chemical reaction by providing an alternative reaction pathway with lower activation energy, without being consumed.',
    syllabusContext: 'Reaction Rates & Chemical Equilibrium',
    exampleSentence: 'Finely divided iron acts as an industrial heterogeneous catalyst in the Haber synthesis of ammonia from atmospheric nitrogen.',
    synonyms: ['reaction promoter', 'accelerator'],
  },

  // --- BIOLOGY & CYTOLOGY ---
  {
    id: 'bio-photosynthesis',
    word: 'Photosynthesis',
    phonetic: '/ˌfəʊ.təʊˈsɪn.θə.sɪs/',
    partOfSpeech: 'scientific term',
    subject: 'BIOLOGY',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The metabolic process by which green plants and photosynthetic organisms synthesize glucose from water and carbon dioxide utilizing absorbed sunlight energy.',
    syllabusContext: 'Plant Nutrition & Chloroplast Physiology',
    exampleSentence: 'In the thylakoid membrane, light-dependent reactions split water photolytically, releasing molecular oxygen as a byproduct.',
    synonyms: ['autotrophic synthesis'],
  },
  {
    id: 'bio-meiosis',
    word: 'Meiosis',
    phonetic: '/maɪˈəʊ.sɪs/',
    partOfSpeech: 'scientific term',
    subject: 'BIOLOGY',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'A two-stage type of cell division in sexually reproducing organisms that reduces the chromosome count by half, producing four genetically distinct haploid gametes.',
    syllabusContext: 'Cell Division & Mendelian Genetics',
    exampleSentence: 'Chiasmata formation during prophase I of meiosis permits homologous crossing-over, generating substantial genetic variation in offspring.',
    synonyms: ['reduction division'],
  },
  {
    id: 'bio-homeostasis',
    word: 'Homeostasis',
    phonetic: '/ˌhəʊ.mi.əʊˈsteɪ.sɪs/',
    partOfSpeech: 'scientific term',
    subject: 'BIOLOGY',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The maintenance of a relatively stable, dynamic internal physiological equilibrium within an organism despite environmental fluctuations.',
    syllabusContext: 'Excretion, Osmoregulation & Endocrine Control',
    exampleSentence: 'The mammalian hypothalamus regulates core body temperature around 37°C through coordinated negative feedback mechanisms.',
    synonyms: ['physiological equilibrium', 'internal balance'],
  },
  {
    id: 'bio-symbiosis',
    word: 'Symbiosis',
    phonetic: '/ˌsɪm.baɪˈəʊ.sɪs/',
    partOfSpeech: 'scientific term',
    subject: 'BIOLOGY',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'A close and persistent biological association between two different species living together, including mutualism, commensalism, and parasitism.',
    syllabusContext: 'Ecology & Inter-species Relationships',
    exampleSentence: 'Lichens illustrate obligate mutualistic symbiosis between photosynthetic algae and protective fungal mycelium.',
    synonyms: ['biological association'],
  },
  {
    id: 'bio-osmoregulation',
    word: 'Osmoregulation',
    phonetic: '/ˌɒz.məʊˌreɡ.jəˈleɪ.ʃən/',
    partOfSpeech: 'scientific term',
    subject: 'BIOLOGY',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The active physiological regulation of osmotic pressure and body fluid balance to maintain homeostasis of water and dissolved mineral solutes.',
    syllabusContext: 'Excretion & Water Balance in Terrestrial Animals',
    exampleSentence: 'Freshwater amoeba utilizes a contractile vacuole to eliminate excess hydrostatic water influx via active osmoregulation.',
    synonyms: ['water and salt balance control'],
  },

  // --- ECONOMICS & COMMERCE ---
  {
    id: 'econ-elasticity',
    word: 'Elasticity',
    phonetic: '/ˌiː.læsˈtɪs.ə.ti/',
    partOfSpeech: 'scientific term',
    subject: 'ECONOMICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'A measure of the responsiveness of the quantity demanded or supplied of a commodity to a change in one of its determining variables (price, income).',
    syllabusContext: 'Theory of Demand & Supply',
    exampleSentence: 'Agricultural staple foods like garri tend to exhibit price-inelastic demand because they represent essential daily necessities.',
    synonyms: ['responsiveness coefficient'],
  },
  {
    id: 'econ-oligopoly',
    word: 'Oligopoly',
    phonetic: '/ˌɒl.ɪˈɡɒp.əl.i/',
    partOfSpeech: 'noun',
    subject: 'ECONOMICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'A market structure characterized by a small number of relatively large firms dominating the industry with high entry barriers and interdependent pricing.',
    syllabusContext: 'Market Structures & Industrial Organization',
    exampleSentence: 'The Nigerian telecommunications sector functions as an oligopoly dominated by four primary network carriers.',
    synonyms: ['concentrated market'],
  },
  {
    id: 'econ-inflation',
    word: 'Inflation',
    phonetic: '/ɪnˈfleɪ.ʃən/',
    partOfSpeech: 'noun',
    subject: 'ECONOMICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'A persistent, sustained increase in the general price level of goods and services in an economy over a period of time, eroding purchasing power.',
    syllabusContext: 'Money, Banking & Macroeconomic Stability',
    exampleSentence: 'Cost-push inflation escalated when international petroleum freight surcharges raised domestic road transportation tariffs.',
    synonyms: ['price hike', 'currency depreciation'],
  },
  {
    id: 'econ-fiscal-policy',
    word: 'Fiscal Policy',
    phonetic: '/ˈfɪs.kəl ˈpɒl.ə.si/',
    partOfSpeech: 'scientific term',
    subject: 'ECONOMICS',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'Government measures regarding taxation, public revenue generation, and government expenditure aimed at influencing macroeconomic economic activity.',
    syllabusContext: 'Public Finance & Government Budgets',
    exampleSentence: 'During economic recessions, expansionary fiscal policy involves reducing corporation tax rates and expanding infrastructure capital outlay.',
    synonyms: ['budgetary policy', 'public expenditure control'],
  },

  // --- GOVERNMENT & CIVICS ---
  {
    id: 'gov-bicameralism',
    word: 'Bicameralism',
    phonetic: '/baɪˈkæm.ər.əl.ɪ.zəm/',
    partOfSpeech: 'noun',
    subject: 'GOVERNMENT',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'A system of government in which legislative power is vested in two distinct parliamentary chambers or houses (e.g., Senate and House of Representatives).',
    syllabusContext: 'Organs of Government & Comparative Constitutions',
    exampleSentence: 'The 1999 Constitution of Nigeria institutes bicameralism at the federal National Assembly comprising the Senate and House of Representatives.',
    synonyms: ['two-chamber legislature'],
  },
  {
    id: 'gov-sovereignty',
    word: 'Sovereignty',
    phonetic: '/ˈsɒv.rɪn.ti/',
    partOfSpeech: 'noun',
    subject: 'GOVERNMENT',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The supreme, ultimate, and absolute political authority and power of an independent state to govern its territory free from external interference.',
    syllabusContext: 'Basic Concepts of Government & Nationhood',
    exampleSentence: 'Popular sovereignty posits that legitimate governmental authority derives fundamentally from the sovereign consent of the enfranchised electorate.',
    synonyms: ['supremacy', 'autonomy', 'jurisdiction'],
  },
  {
    id: 'gov-gerrymandering',
    word: 'Gerrymandering',
    phonetic: '/ˌdʒer.iˈmæn.dər.ɪŋ/',
    partOfSpeech: 'noun',
    subject: 'GOVERNMENT',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'The deliberate manipulation or redrawing of electoral constituency boundaries to establish an unfair political advantage for a specific party or group.',
    syllabusContext: 'Electoral Systems & Franchise Administration',
    exampleSentence: 'The independent electoral commission avoided gerrymandering by basing ward demarcation strictly on census population enumerations.',
    synonyms: ['electoral boundary manipulation'],
  },
  {
    id: 'gov-federalism',
    word: 'Federalism',
    phonetic: '/ˈfed.ər.əl.ɪ.zəm/',
    partOfSpeech: 'noun',
    subject: 'GOVERNMENT',
    examBoardScope: ['JAMB / UTME', 'WAEC', 'NECO', 'GCE', 'POST-UTME', 'NABTEB'],
    definition: 'A system of government where constitutional power is constitutionally divided and shared between a central national authority and constituent sub-national states.',
    syllabusContext: 'Structure of the Nigerian Federal Republic',
    exampleSentence: 'Fiscal federalism governs how oil revenue derivation and VAT receipts are equitably distributed across the 36 states and 774 local governments.',
    synonyms: ['federal system', 'multi-tier governance'],
  },
];

const SUBJECT_OPTIONS = [
  { key: 'ALL', label: 'All Curricula' },
  { key: 'ENGLISH_LEXIS', label: 'Use of English & Lexis' },
  { key: 'MATHEMATICS', label: 'Mathematics & Calculus' },
  { key: 'PHYSICS', label: 'Physics & Kinetics' },
  { key: 'CHEMISTRY', label: 'Chemistry & Stoichiometry' },
  { key: 'BIOLOGY', label: 'Biology & Life Sciences' },
  { key: 'ECONOMICS', label: 'Economics & Commerce' },
  { key: 'GOVERNMENT', label: 'Government & Civics' },
];

export const DictionaryPortal: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const { notifyWarning } = useNotificationStore();

  const filteredEntries = useMemo(() => {
    return ACADEMIC_DICTIONARY_DATA.filter((entry) => {
      const matchesSubject = selectedSubject === 'ALL' || entry.subject === selectedSubject;
      if (!matchesSubject) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        entry.word.toLowerCase().includes(q) ||
        entry.definition.toLowerCase().includes(q) ||
        entry.syllabusContext.toLowerCase().includes(q) ||
        entry.synonyms?.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedSubject]);

  // Standard Web Speech API (zero external AI dependencies)
  const handleSpeakWord = (entry: DictionaryEntry) => {
    if (!('speechSynthesis' in window)) {
      notifyWarning('Audio pronunciation is not supported by your current browser.');
      return;
    }

    if (speakingId === entry.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utteranceText = `${entry.word}. ${entry.partOfSpeech}. Definition: ${entry.definition}`;
    const utterance = new SpeechSynthesisUtterance(utteranceText);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(entry.id);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="premium-portal-page premium-learning-page" style={{ minHeight: '100vh', backgroundColor: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <main className="wrap" style={{ flex: 1, padding: 'clamp(20px, 4vw, 40px) clamp(16px, 3vw, 32px)', boxSizing: 'border-box', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{ marginBottom: '32px' }}>
          <span className="eyebrow" style={{ color: 'var(--forest)', marginBottom: '8px', display: 'block' }}>
            Syllabus-Aligned Reference Companion
          </span>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', margin: '0 0 10px', color: 'var(--ink)' }}>
            Curriculum Lexis &amp; Terminology Handbook
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--ink-soft)', maxWidth: '72ch', lineHeight: '1.6', margin: 0 }}>
            Master core examination vocabulary, lexis registers, scientific terms, and mathematical nomenclature officially vetted for JAMB / UTME, WAEC, NECO, GCE, POST-UTME, and NABTEB.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            backgroundColor: 'var(--white)',
            border: '1.5px solid var(--paper-line)',
            borderRadius: '4px',
            padding: '20px',
            marginBottom: '28px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vocabulary, definitions, synonyms or lexis..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px 12px 38px',
                  borderRadius: '3px',
                  border: '1px solid var(--paper-line)',
                  fontSize: '14px',
                  fontFamily: "var(--font-sans)",
                  backgroundColor: 'var(--paper)',
                  color: 'var(--ink)',
                }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '16px' }}>
                🔍
              </span>
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn-custom btn-custom-ghost"
                style={{ fontSize: '13px', padding: '10px 16px' }}
              >
                Clear Search
              </button>
            )}
          </div>

          {/* Subject Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {SUBJECT_OPTIONS.map((sub) => {
              const isSelected = selectedSubject === sub.key;
              return (
                <button
                  key={sub.key}
                  type="button"
                  onClick={() => setSelectedSubject(sub.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: isSelected ? '1.5px solid var(--forest)' : '1px solid var(--paper-line)',
                    backgroundColor: isSelected ? 'var(--forest)' : 'var(--paper)',
                    color: isSelected ? 'var(--white)' : 'var(--ink)',
                    fontSize: '12px',
                    fontFamily: "var(--font-sans)",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Counter Results */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <span style={{ fontSize: '13px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
            Showing {filteredEntries.length} verified terms
          </span>
          <span style={{ fontSize: '11px', fontFamily: "var(--font-sans)", color: 'var(--forest)', fontWeight: 600 }}>
            Audio Pronunciation Supported (Browser Native)
          </span>
        </div>

        {/* Term Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))', gap: '18px', marginBottom: '48px' }}>
          {filteredEntries.map((entry) => {
            const isSpeaking = speakingId === entry.id;

            return (
              <div
                key={entry.id}
                style={{
                  backgroundColor: 'var(--white)',
                  border: '1.5px solid var(--paper-line)',
                  borderRadius: '4px',
                  padding: '24px',
                  boxShadow: 'var(--card-shadow)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
              >
                <div>
                  {/* Top Row: Word, Phonetic, Audio & Part of Speech */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                    <div>
                      <h3 style={{ fontSize: '22px', margin: 0, fontFamily: "var(--font-sans)", color: 'var(--ink)' }}>
                        {entry.word}
                      </h3>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: '12px', color: 'var(--ink-soft)' }}>
                        {entry.phonetic}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: "var(--font-sans)",
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '2px',
                          backgroundColor: 'var(--paper)',
                          color: 'var(--ink-soft)',
                          border: '1px solid var(--paper-line)',
                        }}
                      >
                        {entry.partOfSpeech}
                      </span>
                      {/* Audio Read-Aloud Button */}
                      <button
                        type="button"
                        onClick={() => handleSpeakWord(entry)}
                        style={{
                          background: isSpeaking ? '#e0f2fe' : 'var(--paper)',
                          border: isSpeaking ? '1px solid #0284c7' : '1px solid var(--paper-line)',
                          color: isSpeaking ? '#0369a1' : 'var(--ink)',
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '13px',
                          transition: 'all 0.15s ease',
                        }}
                        title={isSpeaking ? 'Stop speech' : 'Listen to pronunciation'}
                      >
                        {isSpeaking ? '⏹' : '🔊'}
                      </button>
                    </div>
                  </div>

                  {/* Syllabus Scope Badge */}
                  <div style={{ margin: '8px 0 12px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: "var(--font-sans)",
                        color: 'var(--forest)',
                        backgroundColor: '#e6f4ea',
                        padding: '2px 8px',
                        borderRadius: '2px',
                        fontWeight: 600,
                      }}
                    >
                      {entry.syllabusContext}
                    </span>
                  </div>

                  {/* Definition */}
                  <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--ink)', margin: '0 0 12px', fontFamily: "var(--font-sans)" }}>
                    {entry.definition}
                  </p>

                  {/* Exam Context Example */}
                  <div style={{ padding: '10px 14px', backgroundColor: 'var(--paper)', borderRadius: '3px', borderLeft: '3px solid var(--forest)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', fontFamily: "var(--font-sans)", fontWeight: 700, color: 'var(--forest)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Examination Usage:
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink)', fontStyle: 'italic', lineHeight: '1.5' }}>
                      "{entry.exampleSentence}"
                    </p>
                  </div>

                  {/* Synonyms / Antonyms Tags */}
                  {entry.synonyms && entry.synonyms.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '11px', fontFamily: "var(--font-sans)" }}>
                      <span style={{ color: 'var(--ink-soft)' }}>Synonyms:</span>
                      {entry.synonyms.map((syn, sIdx) => (
                        <span
                          key={sIdx}
                          style={{
                            backgroundColor: 'var(--paper-dim)',
                            padding: '1px 6px',
                            borderRadius: '2px',
                            color: 'var(--ink)',
                          }}
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action: Practice this word in Question Bank */}
                <div style={{ paddingTop: '12px', borderTop: '1px solid var(--paper-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontFamily: "var(--font-sans)", color: 'var(--ink-soft)' }}>
                    Accredited in WAEC &amp; JAMB
                  </span>
                  <Link
                    to={`/portal/questions?search=${encodeURIComponent(entry.word)}`}
                    style={{
                      fontSize: '12px',
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                      color: 'var(--rust)',
                      textDecoration: 'none',
                    }}
                  >
                    Drill Questions →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Revision Quick Actions */}
        <div
          style={{
            backgroundColor: 'var(--ink)',
            color: 'var(--white)',
            padding: '32px',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <span className="eyebrow" style={{ color: 'var(--amber)', marginBottom: '4px', display: 'block' }}>
              Academic Reference Suite
            </span>
            <h3 style={{ fontSize: '22px', margin: '0 0 6px', color: 'var(--white)' }}>
              Reinforce Vocabulary with Science Formulas &amp; CBT Simulations
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.7)', maxWidth: '58ch' }}>
              Jump from terminology mastery directly into full-length mock examinations with official timer rules and server-authoritative scoring.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/portal/formulas" className="btn-custom btn-custom-ghost" style={{ color: 'var(--white)', borderColor: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
              Science Formula Handbook →
            </Link>
            <Link to="/dashboard" className="btn-custom btn-custom-primary" style={{ textDecoration: 'none' }}>
              Launch CBT Exam Room →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

