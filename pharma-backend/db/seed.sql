INSERT INTO drug_classes (name, full_name, description) VALUES
('SSRI', 'Selective serotonin reuptake inhibitor', 'Blocks reuptake of serotonin at the presynaptic terminal, increasing synaptic availability.'),
('SNRI', 'Serotonin-norepinephrine reuptake inhibitor', 'Blocks reuptake of both serotonin and norepinephrine.'),
('TCA', 'Tricyclic antidepressant', 'Older antidepressant class acting on multiple monoamine transporters and receptors.'),
('MAOI', 'Monoamine oxidase inhibitor', 'Blocks the enzyme that breaks down monoamine neurotransmitters.'),
('Opioid', 'Opioid analgesic', 'Acts on opioid receptors, primarily mu-opioid, to relieve pain.'),
('ADHD medication', 'ADHD medication', 'Stimulant or non-stimulant compounds used to manage attention and impulse regulation.'),
('CNS depressant', 'Central nervous system depressant', 'Enhances inhibitory neurotransmission, producing sedative or anxiolytic effects.'),
('Anticoagulant', 'Anticoagulant', 'Reduces blood clotting ability, used to prevent thrombosis.');

-- SSRIs
INSERT INTO drugs (name, brand_names, class_id, approval_year, half_life_hours, route) VALUES
('Sertraline', ARRAY['Zoloft'], (SELECT id FROM drug_classes WHERE name='SSRI'), 1991, 26, 'Hepatic metabolism, renal/fecal excretion'),
('Fluoxetine', ARRAY['Prozac'], (SELECT id FROM drug_classes WHERE name='SSRI'), 1987, 96, 'Hepatic metabolism to active metabolite norfluoxetine'),
('Escitalopram', ARRAY['Lexapro'], (SELECT id FROM drug_classes WHERE name='SSRI'), 2002, 30, 'Hepatic metabolism, renal excretion'),
('Citalopram', ARRAY['Celexa'], (SELECT id FROM drug_classes WHERE name='SSRI'), 1998, 35, 'Hepatic metabolism, renal excretion'),
('Paroxetine', ARRAY['Paxil'], (SELECT id FROM drug_classes WHERE name='SSRI'), 1992, 21, 'Hepatic metabolism, nonlinear kinetics'),
('Fluvoxamine', ARRAY['Luvox'], (SELECT id FROM drug_classes WHERE name='SSRI'), 1994, 15, 'Hepatic metabolism, renal excretion');

-- SNRIs
INSERT INTO drugs (name, brand_names, class_id, approval_year, half_life_hours, route) VALUES
('Venlafaxine', ARRAY['Effexor'], (SELECT id FROM drug_classes WHERE name='SNRI'), 1993, 5, 'Hepatic metabolism to active metabolite desvenlafaxine'),
('Duloxetine', ARRAY['Cymbalta'], (SELECT id FROM drug_classes WHERE name='SNRI'), 2004, 12, 'Hepatic metabolism, renal excretion'),
('Desvenlafaxine', ARRAY['Pristiq'], (SELECT id FROM drug_classes WHERE name='SNRI'), 2008, 11, 'Minimal hepatic metabolism, largely renal excretion');

-- TCAs
INSERT INTO drugs (name, brand_names, class_id, approval_year, half_life_hours, route) VALUES
('Amitriptyline', ARRAY['Elavil'], (SELECT id FROM drug_classes WHERE name='TCA'), 1961, 25, 'Hepatic metabolism to active metabolite nortriptyline'),
('Nortriptyline', ARRAY['Pamelor'], (SELECT id FROM drug_classes WHERE name='TCA'), 1964, 30, 'Hepatic metabolism, renal excretion'),
('Imipramine', ARRAY['Tofranil'], (SELECT id FROM drug_classes WHERE name='TCA'), 1959, 20, 'Hepatic metabolism to active metabolite desipramine');

-- MAOI (kept for interaction reference)
INSERT INTO drugs (name, brand_names, class_id, approval_year, half_life_hours, route) VALUES
('Phenelzine', ARRAY['Nardil'], (SELECT id FROM drug_classes WHERE name='MAOI'), 1961, 2, 'Hepatic acetylation; effect outlasts plasma half-life due to irreversible enzyme binding');

-- Opioids
INSERT INTO drugs (name, brand_names, class_id, approval_year, half_life_hours, route) VALUES
('Tramadol', ARRAY['Ultram'], (SELECT id FROM drug_classes WHERE name='Opioid'), 1995, 6, 'Hepatic metabolism to active metabolite O-desmethyltramadol'),
('Oxycodone', ARRAY['OxyContin', 'Roxicodone'], (SELECT id FROM drug_classes WHERE name='Opioid'), 1950, 4, 'Hepatic metabolism, renal excretion'),
('Morphine', ARRAY['MS Contin'], (SELECT id FROM drug_classes WHERE name='Opioid'), 1941, 3, 'Hepatic glucuronidation, renal excretion'),
('Fentanyl', ARRAY['Duragesic'], (SELECT id FROM drug_classes WHERE name='Opioid'), 1968, 7, 'Hepatic metabolism, renal excretion');

-- ADHD medications
INSERT INTO drugs (name, brand_names, class_id, approval_year, half_life_hours, route) VALUES
('Methylphenidate', ARRAY['Ritalin', 'Concerta'], (SELECT id FROM drug_classes WHERE name='ADHD medication'), 1955, 3, 'Hepatic de-esterification, renal excretion'),
('Amphetamine (mixed salts)', ARRAY['Adderall'], (SELECT id FROM drug_classes WHERE name='ADHD medication'), 1996, 11, 'Hepatic metabolism, renal excretion, pH-dependent'),
('Atomoxetine', ARRAY['Strattera'], (SELECT id FROM drug_classes WHERE name='ADHD medication'), 2002, 5, 'Hepatic metabolism, renal excretion');

-- CNS depressants
INSERT INTO drugs (name, brand_names, class_id, approval_year, half_life_hours, route) VALUES
('Diazepam', ARRAY['Valium'], (SELECT id FROM drug_classes WHERE name='CNS depressant'), 1963, 48, 'Hepatic metabolism to active metabolites, long acting'),
('Alprazolam', ARRAY['Xanax'], (SELECT id FROM drug_classes WHERE name='CNS depressant'), 1981, 11, 'Hepatic metabolism, renal excretion'),
('Zolpidem', ARRAY['Ambien'], (SELECT id FROM drug_classes WHERE name='CNS depressant'), 1992, 2.5, 'Hepatic metabolism, renal excretion');

-- MECHANISMS 

INSERT INTO mechanisms (drug_id, target, action, is_primary) VALUES
((SELECT id FROM drugs WHERE name='Sertraline'), 'SERT', 'Reuptake inhibition', true),
((SELECT id FROM drugs WHERE name='Sertraline'), 'Sigma-1 receptor', 'Agonist', false),
((SELECT id FROM drugs WHERE name='Fluoxetine'), 'SERT', 'Reuptake inhibition', true),
((SELECT id FROM drugs WHERE name='Escitalopram'), 'SERT', 'Reuptake inhibition (high selectivity)', true),
((SELECT id FROM drugs WHERE name='Citalopram'), 'SERT', 'Reuptake inhibition', true),
((SELECT id FROM drugs WHERE name='Paroxetine'), 'SERT', 'Reuptake inhibition', true),
((SELECT id FROM drugs WHERE name='Paroxetine'), 'Muscarinic receptors', 'Antagonist (mild anticholinergic effect)', false),
((SELECT id FROM drugs WHERE name='Fluvoxamine'), 'SERT', 'Reuptake inhibition', true),
((SELECT id FROM drugs WHERE name='Venlafaxine'), 'SERT', 'Reuptake inhibition', true),
((SELECT id FROM drugs WHERE name='Venlafaxine'), 'NET', 'Reuptake inhibition (dose-dependent)', false),
((SELECT id FROM drugs WHERE name='Duloxetine'), 'SERT', 'Reuptake inhibition', true),
((SELECT id FROM drugs WHERE name='Duloxetine'), 'NET', 'Reuptake inhibition', true),
((SELECT id FROM drugs WHERE name='Desvenlafaxine'), 'SERT', 'Reuptake inhibition', true),
((SELECT id FROM drugs WHERE name='Desvenlafaxine'), 'NET', 'Reuptake inhibition', false),
((SELECT id FROM drugs WHERE name='Amitriptyline'), 'SERT', 'Reuptake inhibition', true),
((SELECT id FROM drugs WHERE name='Amitriptyline'), 'NET', 'Reuptake inhibition', true),
((SELECT id FROM drugs WHERE name='Amitriptyline'), 'Histamine H1 receptor', 'Antagonist (sedation)', false),
((SELECT id FROM drugs WHERE name='Nortriptyline'), 'NET', 'Reuptake inhibition', true),
((SELECT id FROM drugs WHERE name='Imipramine'), 'SERT', 'Reuptake inhibition', true),
((SELECT id FROM drugs WHERE name='Imipramine'), 'NET', 'Reuptake inhibition', true),
((SELECT id FROM drugs WHERE name='Phenelzine'), 'Monoamine oxidase A/B', 'Irreversible enzyme inhibition', true),
((SELECT id FROM drugs WHERE name='Tramadol'), 'mu-opioid receptor', 'Weak agonist', true),
((SELECT id FROM drugs WHERE name='Tramadol'), 'SERT / NET', 'Reuptake inhibition', false),
((SELECT id FROM drugs WHERE name='Oxycodone'), 'mu-opioid receptor', 'Agonist', true),
((SELECT id FROM drugs WHERE name='Morphine'), 'mu-opioid receptor', 'Agonist', true),
((SELECT id FROM drugs WHERE name='Fentanyl'), 'mu-opioid receptor', 'High-potency agonist', true),
((SELECT id FROM drugs WHERE name='Methylphenidate'), 'DAT / NET', 'Reuptake inhibition', true),
((SELECT id FROM drugs WHERE name='Amphetamine (mixed salts)'), 'DAT / NET', 'Reuptake inhibition and reverse transport (releaser)', true),
((SELECT id FROM drugs WHERE name='Atomoxetine'), 'NET', 'Reuptake inhibition (selective)', true),
((SELECT id FROM drugs WHERE name='Diazepam'), 'GABA-A receptor', 'Positive allosteric modulator', true),
((SELECT id FROM drugs WHERE name='Alprazolam'), 'GABA-A receptor', 'Positive allosteric modulator', true),
((SELECT id FROM drugs WHERE name='Zolpidem'), 'GABA-A receptor (alpha-1 subunit selective)', 'Positive allosteric modulator', true);

--  METABOLISM (CYP450) 

INSERT INTO metabolism (drug_id, enzyme, role, strength) VALUES
((SELECT id FROM drugs WHERE name='Fluoxetine'), 'CYP2D6', 'inhibitor', 'strong'),
((SELECT id FROM drugs WHERE name='Fluoxetine'), 'CYP3A4', 'inhibitor', 'weak'),
((SELECT id FROM drugs WHERE name='Paroxetine'), 'CYP2D6', 'inhibitor', 'strong'),
((SELECT id FROM drugs WHERE name='Fluvoxamine'), 'CYP1A2', 'inhibitor', 'strong'),
((SELECT id FROM drugs WHERE name='Fluvoxamine'), 'CYP2C19', 'inhibitor', 'strong'),
((SELECT id FROM drugs WHERE name='Fluvoxamine'), 'CYP3A4', 'inhibitor', 'weak'),
((SELECT id FROM drugs WHERE name='Sertraline'), 'CYP2D6', 'inhibitor', 'weak'),
((SELECT id FROM drugs WHERE name='Sertraline'), 'CYP2B6', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Escitalopram'), 'CYP2C19', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Citalopram'), 'CYP2C19', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Venlafaxine'), 'CYP2D6', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Duloxetine'), 'CYP1A2', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Duloxetine'), 'CYP2D6', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Amitriptyline'), 'CYP2D6', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Nortriptyline'), 'CYP2D6', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Imipramine'), 'CYP2D6', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Tramadol'), 'CYP2D6', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Tramadol'), 'CYP3A4', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Oxycodone'), 'CYP3A4', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Oxycodone'), 'CYP2D6', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Fentanyl'), 'CYP3A4', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Atomoxetine'), 'CYP2D6', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Alprazolam'), 'CYP3A4', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Diazepam'), 'CYP3A4', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Diazepam'), 'CYP2C19', 'substrate', NULL),
((SELECT id FROM drugs WHERE name='Zolpidem'), 'CYP3A4', 'substrate', NULL);


INSERT INTO drugs (name, brand_names, class_id, approval_year)
VALUES ('Warfarin', ARRAY['Coumadin'], (SELECT id FROM drug_classes WHERE name='Anticoagulant'), 1954)
ON CONFLICT (name) DO NOTHING;

--INTERACTIONS 

INSERT INTO interactions (drug_a_id, drug_b_id, risk_level, risk_label, mechanism_note, source) VALUES
((SELECT id FROM drugs WHERE name='Sertraline'), (SELECT id FROM drugs WHERE name='Phenelzine'), 'contraindicated', 'Serotonin syndrome risk', 'Combining an SSRI with an MAOI can cause dangerous serotonin accumulation; labels require a washout period between the two.', 'OpenFDA label'),
((SELECT id FROM drugs WHERE name='Sertraline'), (SELECT id FROM drugs WHERE name='Tramadol'), 'contraindicated', 'Serotonin syndrome risk', 'Tramadol has serotonergic activity of its own on top of its opioid effect, compounding SSRI serotonin elevation.', 'OpenFDA label'),
((SELECT id FROM drugs WHERE name='Fluoxetine'), (SELECT id FROM drugs WHERE name='Tramadol'), 'caution', 'CYP2D6 competition + serotonin syndrome risk', 'Fluoxetine strongly inhibits CYP2D6, the enzyme that activates tramadol, and both raise serotonin.', 'DrugBank'),
((SELECT id FROM drugs WHERE name='Amitriptyline'), (SELECT id FROM drugs WHERE name='Phenelzine'), 'contraindicated', 'Serotonin syndrome / hypertensive crisis risk', 'TCAs combined with MAOIs carry a classic and severe interaction risk documented since the 1960s.', 'OpenFDA label'),
((SELECT id FROM drugs WHERE name='Alprazolam'), (SELECT id FROM drugs WHERE name='Oxycodone'), 'contraindicated', 'Respiratory depression risk', 'Combining a benzodiazepine with an opioid compounds CNS and respiratory depression; boxed warning territory.', 'OpenFDA label'),
((SELECT id FROM drugs WHERE name='Diazepam'), (SELECT id FROM drugs WHERE name='Morphine'), 'contraindicated', 'Respiratory depression risk', 'Same class-level mechanism as other benzodiazepine-opioid pairings.', 'OpenFDA label'),
((SELECT id FROM drugs WHERE name='Fluvoxamine'), (SELECT id FROM drugs WHERE name='Alprazolam'), 'caution', 'Elevated benzodiazepine levels', 'Fluvoxamine strongly inhibits CYP3A4 and CYP2C19, slowing clearance of several benzodiazepines.', 'DrugBank'),
((SELECT id FROM drugs WHERE name='Methylphenidate'), (SELECT id FROM drugs WHERE name='Phenelzine'), 'contraindicated', 'Hypertensive crisis risk', 'Stimulants combined with MAOIs can cause dangerous spikes in blood pressure.', 'OpenFDA label'),
((SELECT id FROM drugs WHERE name='Sertraline'), (SELECT id FROM drugs WHERE name='Warfarin'), 'caution', 'Increased bleeding risk', 'SSRIs can impair platelet aggregation, and this compounds with anticoagulant effect.', 'DrugBank');

-- HISTORY EVENTS 

INSERT INTO history_events (class_id, year_label, sort_year, title, description) VALUES
((SELECT id FROM drug_classes WHERE name='TCA'), '1950s', 1957, 'First TCA discovered', 'Imipramine emerges from antihistamine research at a Swiss pharmaceutical lab, launching the tricyclic class.'),
((SELECT id FROM drug_classes WHERE name='MAOI'), '1950s', 1958, 'MAOIs enter clinical use', 'Iproniazid, originally a tuberculosis drug, is observed to elevate mood, leading to the MAOI class.'),
((SELECT id FROM drug_classes WHERE name='SSRI'), '1970s', 1972, 'Selective serotonin research begins', 'Receptor-binding assays lead researchers toward compounds more selective than TCAs.'),
((SELECT id FROM drug_classes WHERE name='SSRI'), '1987', 1987, 'Fluoxetine approved', 'The first SSRI reaches the US market under the brand Prozac, reshaping depression treatment.'),
((SELECT id FROM drug_classes WHERE name='SNRI'), '1990s', 1993, 'SNRIs emerge', 'Venlafaxine becomes the first widely used SNRI, targeting both serotonin and norepinephrine.'),
((SELECT id FROM drug_classes WHERE name='ADHD medication'), '1996', 1996, 'Amphetamine mixed salts approved', 'Adderall is approved, becoming a widely prescribed ADHD stimulant.'),
((SELECT id FROM drug_classes WHERE name='Opioid'), '2000s', 2001, 'Opioid prescribing scrutiny grows', 'Rising awareness of dependence risk begins reshaping opioid prescribing guidelines in the following decade.'),
((SELECT id FROM drug_classes WHERE name='ADHD medication'), '2002', 2002, 'Atomoxetine approved', 'The first non-stimulant ADHD medication reaches market, targeting norepinephrine selectively.');
