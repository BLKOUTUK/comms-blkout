// The society's own registration facts, for the /admin front page.
//
// SOURCE OF TRUTH: ~/blkout/governance/cbs/README.md, itself taken from the registered
// documents in rules-of-the-society.pdf (FCA certificate + adopted Rules). If this file
// and that README disagree, the README wins — and the Rules win over both.
//
// WHAT MAY GO IN HERE: only facts already on the public FCA Mutuals Register, plus the
// officers and the dates the board has set. This file is compiled into the public JS
// bundle that every anonymous visitor to comms.blkoutuk.cloud downloads. No UTR, no
// insurance policy number, no phone number, no bank detail — ever. If a new fact is not
// already public on the register, it does not belong here.

export interface IdentityFact {
  label: string;
  value: string;
  /** Something unresolved that a person should act on, not a fact to rely on. */
  flag?: boolean;
}

export const ORG_IDENTITY = {
  legalName: 'BLKOUT Creative Limited',
  tradingName: 'BLKOUT UK',

  registration: [
    {
      label: 'Legal form',
      value:
        'Community Benefit Society (registered society) under the Co-operative and Community Benefit Societies Act 2014 — permanent statutory asset lock',
    },
    {
      label: 'Register',
      value: 'FCA Mutuals Public Register no. 9639 (cited as RS009639) · registered 24 November 2025',
    },
    {
      label: 'Registered office',
      value: '2 Grange Park Road, Thornton Heath, London CR7 8QA',
    },
    {
      label: 'Financial year-end',
      value: '30 September · first accounting period 24 Nov 2025 – 30 Sep 2026',
    },
    {
      label: 'Also',
      value:
        'Not VAT registered · not at Companies House — a form asking for a Companies House number has the wrong entity type',
    },
  ] as IdentityFact[],

  officers: [
    { label: 'Chair', value: 'Peter Fleming' },
    { label: 'Secretary and Vice-Chair', value: 'Lanre Jackson-Cole' },
    {
      label: 'Directors',
      value:
        'Nathan Lewis · Lloyd Young · Jean-Eric Nkurikiye · Peter Fleming · Reuben Silungwe · Lanre Jackson-Cole (assumed office 18 Mar 2026)',
    },
    {
      label: 'To reconcile',
      value:
        'FCA registration (16 Oct 2025) names Robert Berkeley as Secretary — reconcile with the board return before the Rule 126 register is signed off.',
      flag: true,
    },
  ] as IdentityFact[],

  keyDates: [
    {
      label: 'AGM',
      value:
        'End October 2026 — date set at the September board. All directors stand down at the first AGM (Rule 70).',
    },
    { label: 'First anniversary', value: '24 November 2026' },
    { label: 'Joseph Beam Day', value: '28 December 2026 — membership opens' },
  ] as IdentityFact[],

  contact: 'rob@blkoutuk.com',
  // Text, not a link: the pack is not web-served.
  governingDocuments: 'governance/cbs/rules-of-the-society.pdf',
} as const;
