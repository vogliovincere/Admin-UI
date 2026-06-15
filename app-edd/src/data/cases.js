/* =========================================================================
   Mock EDD case queue
   -------------------------------------------------------------------------
   These represent accounts that completed the standard Interro KYC/KYB flow,
   were routed to Alloy, and came back from Alloy's decisioning as "Manual
   Review — additional documentation required" (the EDD branch of the
   product-manager whiteboard, Scenario 1.2).

   Each case carries:
     - the Alloy review result (outcome + the reasons it flagged), and
     - `recommendedItemIds` — the items Alloy's review determined are needed.
       These pre-populate the EDD request so the form is "informed by what we
       determine is needed within Alloy" (Drew's note).

   Actors (fintech / fund-administration context):
     - GP  = General Partner / fund contact — Interro's SaaS client's customer
             (the example SaaS client is Delio). The compliance team can send
             the collection link to the GP, who relays it to the investor.
     - LP  = Limited Partner / investor — the end user being diligenced. The
             compliance team can also send the link directly to the LP.
   ========================================================================= */

export const cases = [
  {
    id: 'case_acme',
    subjectType: 'entity',
    entityName: 'Acme Holdings LLC',
    subjectName: 'Acme Holdings LLC',
    flaggedParty: 'Jane Smith (Beneficial owner, 60%)',
    context: 'Capital call — Westbridge Fund III',
    saasClient: 'Delio',
    gp: { name: 'Daniel Reyes', email: 'daniel.reyes@westbridge.com', firm: 'Westbridge Capital (GP)' },
    lp: { name: 'Jane Smith', email: 'jane.smith@acmeholdings.com' },
    alloyReview: {
      outcome: 'Manual Review',
      riskScore: 72,
      runDate: '2026-06-04',
      reasons: [
        'Beneficial owner linked to a higher-risk jurisdiction',
        'Ownership structure could not be fully verified from public registries',
        'Investment size inconsistent with available financial profile',
      ],
    },
    recommendedItemIds: ['ownership_chart', 'source_of_funds', 'audited_financials'],
  },
  {
    id: 'case_doe',
    subjectType: 'individual',
    entityName: null,
    subjectName: 'John Doe',
    flaggedParty: 'John Doe (Individual investor)',
    context: 'Capital call — Meridian Private Credit',
    saasClient: 'Delio',
    gp: { name: 'Priya Nair', email: 'priya.nair@meridian.com', firm: 'Meridian Partners (GP)' },
    lp: { name: 'John Doe', email: 'john.doe@email.com' },
    alloyReview: {
      outcome: 'Manual Review',
      riskScore: 58,
      runDate: '2026-06-05',
      reasons: [
        'Large capital commitment inconsistent with declared profile',
        'Source of funds not evidenced during standard KYC',
      ],
    },
    recommendedItemIds: ['source_of_funds_narrative', 'source_of_funds', 'bank_statement', 'proof_of_address'],
  },
  {
    id: 'case_meridian',
    subjectType: 'entity',
    entityName: 'Meridian Capital Partners',
    subjectName: 'Meridian Capital Partners',
    flaggedParty: 'Robert Kim (Beneficial owner, 35%)',
    context: 'Onboarding — Co-investment vehicle',
    saasClient: 'Delio',
    gp: { name: 'Sofia Marchetti', email: 'sofia.marchetti@altafund.com', firm: 'Alta Fund Services (GP)' },
    lp: { name: 'Robert Kim', email: 'robert.kim@meridiancp.com' },
    alloyReview: {
      outcome: 'Manual Review',
      riskScore: 81,
      runDate: '2026-06-03',
      reasons: [
        'Potential Politically Exposed Person (PEP) match on a beneficial owner',
        'Adverse-media screening hit requires clarification',
      ],
    },
    recommendedItemIds: ['pep_declaration', 'source_of_wealth', 'additional_id', 'purpose_of_account'],
  },
]

export const caseById = Object.fromEntries(cases.map((c) => [c.id, c]))
