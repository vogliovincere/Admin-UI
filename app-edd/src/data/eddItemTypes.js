/* =========================================================================
   EDD requestable-item catalog
   -------------------------------------------------------------------------
   This is the library of items the Interro compliance team can request during
   Enhanced Due Diligence. Per Drew's note, the EDD collection form is a
   "generic input form / data drop that is informed by what we determine is
   needed within Alloy" — so each Alloy manual-review case maps to a recommended
   subset of these items (see cases.js → recommendedItemIds), and the compliance
   officer can add or remove items before sending.

   kind:
     'document' → renders an upload / data-drop zone in the collection flow
     'field'    → renders a text / textarea / select / yes-no input

   `category` only groups items in the console picker.
   ========================================================================= */

export const EDD_CATEGORIES = [
  { id: 'funds', label: 'Source of funds & wealth' },
  { id: 'identity', label: 'Identity & address' },
  { id: 'entity', label: 'Corporate / entity' },
  { id: 'risk', label: 'Risk & compliance' },
]

export const eddItemTypes = [
  // ---- Source of funds & wealth ----
  {
    id: 'source_of_funds',
    label: 'Source of funds — evidence',
    kind: 'document',
    category: 'funds',
    description: 'Documents evidencing the origin of the funds being invested (e.g. property sale, business proceeds, investment maturity, inheritance).',
  },
  {
    id: 'source_of_funds_narrative',
    label: 'Source of funds — written explanation',
    kind: 'field',
    fieldType: 'textarea',
    category: 'funds',
    description: 'A short written explanation of where the invested funds originated.',
    placeholder: 'e.g. Proceeds from the 2024 sale of a commercial property in Manchester…',
  },
  {
    id: 'source_of_wealth',
    label: 'Source of wealth — statement',
    kind: 'document',
    category: 'funds',
    description: 'Evidence of how overall wealth was accumulated over time (e.g. audited accounts, tax returns, sale agreements).',
  },
  {
    id: 'bank_statement',
    label: 'Recent bank statement',
    kind: 'document',
    category: 'funds',
    description: 'A bank statement from the last 3 months for the account the investment will be funded from.',
  },
  {
    id: 'net_worth',
    label: 'Estimated net worth',
    kind: 'field',
    fieldType: 'select',
    category: 'funds',
    options: ['Under $1M', '$1M – $5M', '$5M – $25M', '$25M – $100M', 'Over $100M'],
    description: 'Self-declared estimated net worth band.',
  },

  // ---- Identity & address ----
  {
    id: 'additional_id',
    label: 'Additional government-issued ID',
    kind: 'document',
    category: 'identity',
    description: 'A second government-issued photo ID (passport, national ID, or driver’s licence).',
  },
  {
    id: 'proof_of_address',
    label: 'Proof of address',
    kind: 'document',
    category: 'identity',
    description: 'Utility bill, bank statement or government correspondence dated within the last 3 months.',
  },
  {
    id: 'occupation',
    label: 'Occupation & employer',
    kind: 'field',
    fieldType: 'text',
    category: 'identity',
    description: 'Current occupation and employer.',
    placeholder: 'e.g. Managing Director, Westbridge Capital',
  },

  // ---- Corporate / entity ----
  {
    id: 'ownership_chart',
    label: 'Ownership / control structure chart',
    kind: 'document',
    category: 'entity',
    description: 'A diagram or document setting out the full beneficial ownership and control structure of the entity.',
  },
  {
    id: 'certificate_incorporation',
    label: 'Certificate of incorporation',
    kind: 'document',
    category: 'entity',
    description: 'The entity’s certificate of incorporation or equivalent formation document.',
  },
  {
    id: 'audited_financials',
    label: 'Audited financial statements',
    kind: 'document',
    category: 'entity',
    description: 'Most recent audited financial statements for the entity.',
  },

  // ---- Risk & compliance ----
  {
    id: 'purpose_of_account',
    label: 'Purpose of the investment',
    kind: 'field',
    fieldType: 'textarea',
    category: 'risk',
    description: 'The intended purpose and nature of the investment relationship.',
    placeholder: 'e.g. Long-term capital allocation into the Fund III private credit strategy…',
  },
  {
    id: 'expected_activity',
    label: 'Expected activity & volume',
    kind: 'field',
    fieldType: 'textarea',
    category: 'risk',
    description: 'Expected frequency and size of contributions / activity.',
    placeholder: 'e.g. A single capital commitment of $2.5M, with quarterly drawdowns…',
  },
  {
    id: 'pep_declaration',
    label: 'Politically Exposed Person (PEP) declaration',
    kind: 'field',
    fieldType: 'yesno',
    category: 'risk',
    description: 'Declaration of whether the individual is, or is closely associated with, a Politically Exposed Person.',
    yesLabel: 'I am / am associated with a PEP',
    noLabel: 'I am not a PEP',
  },
]

export const eddItemById = Object.fromEntries(eddItemTypes.map((i) => [i.id, i]))
