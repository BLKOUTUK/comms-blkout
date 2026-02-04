/**
 * useGrants Hook
 * React hook for grant funding management
 * Connects UI to GrantsClient service
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  Grant,
  Priority,
  OpportunityPipeline,
  BidWritingProgress,
  BidWritingTemplate,
} from '@/types';

// Pipeline summary type
interface PipelineSummary {
  totalGrants: number;
  totalRequested: number;
  totalAwarded: number;
  successRate: number;
  activeApplications: number;
  upcomingDeadlines: number;
}

// Mock data for development without Supabase
const mockGrants: Grant[] = [
  {
    id: '1',
    title: 'National Lottery Community Fund - Reaching Communities',
    funder_name: 'National Lottery Community Fund',
    funder_type: 'lottery',
    amount_requested: 150000,
    deadline_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'preparing',
    priority: 'critical',
    strategic_fit_score: 9,
    scaling_tier: 'growth',
    writing_investment_hours: 40,
    review_required: 'full_external',
    geographic_scope: 'national',
    participant_range_min: 500,
    participant_range_max: 2000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Paul Hamlyn Foundation - Ideas and Pioneers',
    funder_name: 'Paul Hamlyn Foundation',
    funder_type: 'trust',
    amount_requested: 75000,
    deadline_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'eligible',
    priority: 'high',
    strategic_fit_score: 8,
    scaling_tier: 'seed',
    writing_investment_hours: 24,
    review_required: 'peer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Comic Relief - Tech for Good',
    funder_name: 'Comic Relief',
    funder_type: 'foundation',
    amount_requested: 50000,
    deadline_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'researching',
    priority: 'medium',
    strategic_fit_score: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Esmée Fairbairn Foundation - Social Change',
    funder_name: 'Esmée Fairbairn Foundation',
    funder_type: 'trust',
    amount_requested: 200000,
    deadline_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'submitted',
    priority: 'high',
    strategic_fit_score: 9,
    scaling_tier: 'scale',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ==================== REAL BID: Trust for London EOI ====================
  {
    id: '5',
    title: 'Trust for London - Racial Justice Fund (BLKOUTNXT: Economic Futures)',
    funder_name: 'Trust for London',
    funder_type: 'trust',
    program_area: 'Racial Justice',
    amount_requested: 200000,
    status: 'preparing',
    priority: 'critical',
    strategic_fit_score: 10,
    blkout_priority_alignment: {
      liberation: 10,
      ownership: 10,
      mental_health: 8,
      economic_justice: 10,
      movement_building: 9,
    },
    funder_relationship_score: 7,
    scaling_tier: 'scale',
    min_viable_budget: 150000,
    max_potential_budget: 250000,
    geographic_scope: 'city',
    participant_range_min: 25,
    participant_range_max: 30,
    scaling_notes: '3-year programme. Strand 1: 18-month action research with cohort of 25-30 Black queer men. Strand 2: Cooperative infrastructure development for community enterprise.',
    writing_investment_hours: 60,
    review_required: 'full_external',
    is_modular: true,
    can_fund_independently: false,
    lead_writer: 'Dr Rob Berkeley MBE',
    team_members: ['Dr Rob Berkeley MBE', 'Project Lead (TBC)'],
    tags: ['racial-justice', 'economic-empowerment', 'action-research', 'cooperative', 'CBS', 'intersectional', 'community-wealth'],
    notes: 'Expression of Interest for BLKOUTNXT: Economic Futures programme. Two strands: (1) Participatory action research on employment experiences at intersection of race and sexuality, with 25-30 person intergenerational cohort and 3-5 peer researchers. Cross-sector advocacy with Black employment and men\'s employment initiatives. Academic partners: King\'s College London, Sheffield University, UAL. (2) Cooperative infrastructure development - feasibility work for community-owned enterprise (venue, subscription, media). CBS governance. Budget: Staffing £122,623 (Director 0.2 FTE + Project Lead 0.6 FTE), Research £46,000, Cooperative dev £20,000, Core costs £11,377. Aligns with TfL priorities: increase household incomes + increase household/community wealth.',
    documents: [
      { name: 'Expression of Interest - Main', url: '', type: 'application', uploadedAt: '2026-01-31T00:00:00Z' },
      { name: 'Budget Narrative (3-Year)', url: '', type: 'budget', uploadedAt: '2026-01-31T00:00:00Z' },
      { name: 'Theory of Change', url: '', type: 'narrative', uploadedAt: '2026-01-31T00:00:00Z' },
      { name: 'Risk Assessment', url: '', type: 'other', uploadedAt: '2026-01-31T00:00:00Z' },
      { name: 'Safeguarding Statement', url: '', type: 'other', uploadedAt: '2026-01-31T00:00:00Z' },
      { name: 'Supporting Documents List', url: '', type: 'other', uploadedAt: '2026-01-31T00:00:00Z' },
    ],
    created_at: '2026-01-31T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
];

const mockOpportunities: OpportunityPipeline[] = [
  {
    id: '1',
    title: 'Wellcome Trust - Mental Health Research',
    funder_name: 'Wellcome Trust',
    source: 'ivor_research',
    status: 'recommended',
    funding_min: 100000,
    funding_max: 500000,
    deadline_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    days_until_deadline: 45,
    deadline_urgency: 'future',
    combined_fit_score: 8.5,
    project_category: 'mental_health',
    recommended_project: 'IVOR Mental Health Support Module',
    funder_priorities: ['Community-led research', 'Digital innovation', 'Underserved communities'],
    discovered_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Arts Council England - Developing Your Creative Practice',
    funder_name: 'Arts Council England',
    source: 'charity_excellence',
    status: 'new',
    funding_min: 2000,
    funding_max: 10000,
    deadline_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    days_until_deadline: 21,
    deadline_urgency: 'approaching',
    combined_fit_score: 7.2,
    project_category: 'creative',
    funder_priorities: ['Diverse artists', 'Career development'],
    discovered_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'City Bridge Trust - Connecting Communities',
    funder_name: 'City Bridge Trust',
    source: '360giving',
    status: 'assessing',
    funding_min: 50000,
    funding_max: 150000,
    days_until_deadline: 90,
    deadline_urgency: 'future',
    combined_fit_score: 8.0,
    project_category: 'infrastructure',
    funder_priorities: ['London-based', 'Digital inclusion', 'LGBTQ+ communities'],
    discovered_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ==================== REAL GRANT OPPORTUNITIES ====================
  {
    id: '4',
    title: 'Consortium LGBT+ Collective Nurture Fund',
    funder_name: 'LGBT Consortium',
    source: 'funder_website',
    source_url: 'https://www.consortium.lgbt',
    status: 'recommended',
    funding_min: 5000,
    funding_max: 5000,
    deadline_date: '2025-09-03',
    days_until_deadline: Math.ceil((new Date('2025-09-03').getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    deadline_urgency: new Date('2025-09-03') < new Date() ? 'expired' : 'future',
    combined_fit_score: 9.0,
    project_category: 'capacity_building',
    eligibility_criteria: 'LGBT+ Global Majority community groups and organisations across UK',
    blkout_alignment_notes: 'Specifically targets LGBT+ Global Majority groups. BLKOUT is ideal candidate.',
    funder_priorities: ['LGBT+ Global Majority communities', 'Community groups', 'UK-wide'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Lloyds Bank Foundation - Racial Equity Grants',
    funder_name: 'Lloyds Bank Foundation',
    source: 'funder_website',
    source_url: 'https://www.lloydsbankfoundation.org.uk/funding',
    status: 'recommended',
    funding_min: 75000,
    funding_max: 75000,
    deadline_date: '2025-05-29',
    days_until_deadline: Math.ceil((new Date('2025-05-29').getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    deadline_urgency: new Date('2025-05-29') < new Date() ? 'expired' : 'future',
    combined_fit_score: 8.5,
    project_category: 'capacity_building',
    eligibility_criteria: 'Black-led charities/CICs, income £25k-£500k, based OUTSIDE London',
    blkout_alignment_notes: 'Unrestricted funding + development support. 3-year funding. Check if BLKOUT operates outside London.',
    research_notes: 'Webinar 3 April 2025. Contact: enquiries@lloydsbankfoundation.org.uk',
    funder_priorities: ['Black-led organisations', 'Racial equity', 'Unrestricted funding'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Flexible Finance Fund',
    funder_name: 'Ubele Initiative / Social Investment Business / Create Equity',
    source: 'manual',
    source_url: 'https://www.sibgroup.org.uk/funds/flexible-finance/',
    status: 'assessing',
    funding_min: 50000,
    funding_max: 1500000,
    deadline_urgency: 'no_deadline',
    combined_fit_score: 7.0,
    project_category: 'infrastructure',
    eligibility_criteria: 'Black-led (51%+ board), min £200k turnover, 2+ years operating',
    blkout_alignment_notes: 'Grant + loan blend. Grant up to 100% of loan value (max £200k grant). Dedicated advisor support. Check turnover eligibility.',
    research_notes: 'Contact: sheila.forster@ubele.org. Rolling deadline.',
    funder_priorities: ['Black-led organisations', 'Social enterprise', 'Community wealth building'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    title: 'Manchester Pride - Local Pride Grants',
    funder_name: 'Manchester Pride',
    source: 'funder_website',
    source_url: 'https://www.manchesterpride.com/grants',
    status: 'researching',
    funding_min: 250,
    funding_max: 1000,
    deadline_date: '2025-03-10',
    days_until_deadline: Math.ceil((new Date('2025-03-10').getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    deadline_urgency: new Date('2025-03-10') < new Date() ? 'expired' : 'future',
    combined_fit_score: 6.5,
    project_category: 'creative',
    eligibility_criteria: 'Greater Manchester LGBTQ+ groups',
    blkout_alignment_notes: 'Needs Manchester connection. Quick turnaround, small grants for Pride activities.',
    funder_priorities: ['LGBTQ+ communities', 'Greater Manchester', 'Pride activities'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    title: 'Manchester Pride - Impact Grants',
    funder_name: 'Manchester Pride',
    source: 'funder_website',
    source_url: 'https://www.manchesterpride.com/grants',
    status: 'researching',
    deadline_date: '2025-03-21',
    days_until_deadline: Math.ceil((new Date('2025-03-21').getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    deadline_urgency: new Date('2025-03-21') < new Date() ? 'expired' : 'future',
    combined_fit_score: 6.5,
    project_category: 'capacity_building',
    eligibility_criteria: 'Greater Manchester LGBTQ+ charities',
    blkout_alignment_notes: 'Larger/longer-term funding. Needs Manchester connection. For sustained LGBTQ+ impact work.',
    funder_priorities: ['LGBTQ+ charities', 'Greater Manchester', 'Sustained impact'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '9',
    title: 'Manchester Pride - Community/Superbia Grants',
    funder_name: 'Manchester Pride',
    source: 'funder_website',
    source_url: 'https://www.manchesterpride.com/grants',
    status: 'assessing',
    funding_min: 250,
    funding_max: 1000,
    deadline_date: '2025-04-30',
    days_until_deadline: Math.ceil((new Date('2025-04-30').getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    deadline_urgency: new Date('2025-04-30') < new Date() ? 'expired' : 'future',
    combined_fit_score: 7.5,
    project_category: 'creative',
    eligibility_criteria: 'Greater Manchester LGBTQ+ groups, priority: disabled, QTIPOC, Trans',
    blkout_alignment_notes: 'QTIPOC priority is good fit. Round 2 opens Aug-Sept 2025.',
    funder_priorities: ['QTIPOC communities', 'Disabled LGBTQ+', 'Trans communities', 'Greater Manchester'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '10',
    title: 'National Lottery Awards for All (England)',
    funder_name: 'National Lottery Community Fund',
    source: 'funder_website',
    source_url: 'https://www.tnlcommunityfund.org.uk/funding/programmes',
    status: 'recommended',
    funding_min: 300,
    funding_max: 20000,
    deadline_urgency: 'no_deadline',
    combined_fit_score: 8.5,
    project_category: 'capacity_building',
    eligibility_criteria: 'Constituted community groups, charities',
    blkout_alignment_notes: 'Accessible entry point. Always open. Up to 2 years funding. Good for community wellbeing projects.',
    recommended_project: 'Community wellbeing programme',
    funder_priorities: ['Community wellbeing', 'Constituted groups', 'England-wide'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '11',
    title: 'National Lottery Climate Action Fund',
    funder_name: 'National Lottery Community Fund',
    source: 'funder_website',
    source_url: 'https://www.tnlcommunityfund.org.uk/funding/programmes',
    status: 'researching',
    funding_min: 500000,
    deadline_date: '2025-10-22',
    days_until_deadline: Math.ceil((new Date('2025-10-22').getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    deadline_urgency: new Date('2025-10-22') < new Date() ? 'expired' : 'future',
    combined_fit_score: 5.0,
    project_category: 'advocacy',
    eligibility_criteria: 'Partnership-led projects, priority for marginalised communities',
    blkout_alignment_notes: 'Would need climate justice angle. Large scale, requires partnership approach.',
    funder_priorities: ['Climate action', 'Marginalised communities', 'Partnership-led'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '12',
    title: 'Consortium LGBT+ Youth Advocacy Fund',
    funder_name: 'LGBT Consortium / Henry Smith Foundation',
    source: 'funder_website',
    source_url: 'https://www.consortium.lgbt',
    status: 'recommended',
    deadline_date: '2025-08-27',
    days_until_deadline: Math.ceil((new Date('2025-08-27').getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    deadline_urgency: new Date('2025-08-27') < new Date() ? 'expired' : 'future',
    combined_fit_score: 8.0,
    project_category: 'advocacy',
    eligibility_criteria: 'UK orgs supporting LGBT+ young people 14-25',
    blkout_alignment_notes: 'High priority if developing youth work. Focus on strengthening sustainability and resources.',
    research_notes: 'Contact: grants@consortium.lgbt',
    funder_priorities: ['LGBT+ young people', 'Sustainability', 'Youth advocacy 14-25'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '13',
    title: 'London Inclusive Talent Brokerage',
    funder_name: 'Greater London Authority',
    source: 'manual',
    status: 'assessing',
    funding_min: 40000,
    funding_max: 70000,
    deadline_date: '2025-09-05',
    days_until_deadline: Math.ceil((new Date('2025-09-05').getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    deadline_urgency: new Date('2025-09-05') < new Date() ? 'expired' : 'future',
    combined_fit_score: 7.0,
    project_category: 'capacity_building',
    eligibility_criteria: 'Black/minority-ethnic led orgs (50%+ leadership), London-based',
    blkout_alignment_notes: 'Medium priority if developing employability work. Delivery Sept 2025 - Sept 2026. Opens 1 August 2025.',
    research_notes: 'Contact: grants@london.gov.uk',
    funder_priorities: ['Black/minority-ethnic led organisations', 'Employability', 'London-based'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '14',
    title: 'Henry Smith Foundation - Shout! Fund',
    funder_name: 'Henry Smith Foundation',
    source: 'funder_website',
    source_url: 'https://henrysmith.foundation/grants/shout/',
    status: 'researching',
    funding_max: 240000,
    deadline_urgency: 'no_deadline',
    combined_fit_score: 8.5,
    project_category: 'advocacy',
    eligibility_criteria: 'Advocacy services for LGBT+ young people 14-25',
    blkout_alignment_notes: 'Currently closed - monitor for 2026 round reopening. Person-led advocacy focus. Interest in Wales, NI, rural areas.',
    research_notes: 'Contact: buildingindependence@henrysmith.foundation. Up to 4 years funding.',
    funder_priorities: ['LGBT+ young people 14-25', 'Person-led advocacy', 'Wales/NI/rural areas'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '15',
    title: 'Phoenix Way 2.0',
    funder_name: 'National Lottery / Ubele Initiative',
    source: 'manual',
    source_url: 'https://ubele.org',
    status: 'recommended',
    deadline_urgency: 'no_deadline',
    combined_fit_score: 9.0,
    project_category: 'capacity_building',
    eligibility_criteria: 'Black and Minoritised community-led groups',
    blkout_alignment_notes: 'Perfect fit for BLKOUT. Decision-making by community leaders. Priorities: young people, women/girls. Part of £50m programme over 5 years. Regional rounds.',
    funder_priorities: ['Black and Minoritised communities', 'Community-led', 'Young people', 'Women/girls'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '16',
    title: 'Baobab Community Fund',
    funder_name: 'Baobab Foundation',
    source: 'funder_website',
    source_url: 'https://www.baobabfoundation.org.uk',
    status: 'researching',
    funding_min: 5000,
    funding_max: 30000,
    deadline_urgency: 'no_deadline',
    combined_fit_score: 8.5,
    project_category: 'capacity_building',
    eligibility_criteria: 'Black African/Caribbean and Global Majority orgs',
    blkout_alignment_notes: 'Currently closed - monitor for reopening. Multi-year funding (up to 5 years). Racial justice and climate equity focus.',
    funder_priorities: ['Black African/Caribbean orgs', 'Global Majority', 'Racial justice', 'Climate equity'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '17',
    title: 'F100 Growth Fund',
    funder_name: 'Black Equity Organisation / Sky',
    source: 'manual',
    source_url: 'https://www.blackequityorg.com',
    status: 'new',
    funding_max: 15000,
    deadline_urgency: 'no_deadline',
    combined_fit_score: 6.5,
    project_category: 'capacity_building',
    eligibility_criteria: 'Black-led UK businesses with MVP',
    blkout_alignment_notes: 'Check current round. Video + presentation required. 2025 cohort. Includes Sky broadband.',
    funder_priorities: ['Black-led businesses', 'Growth stage', 'MVP required'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '18',
    title: 'Black Seed Ventures',
    funder_name: 'Black Seed',
    source: 'manual',
    status: 'new',
    funding_max: 400000,
    deadline_urgency: 'no_deadline',
    combined_fit_score: 5.0,
    project_category: 'infrastructure',
    eligibility_criteria: 'Black-owned UK businesses, early-stage',
    blkout_alignment_notes: 'Rolling applications. More suited for commercial ventures. Seed funding for entrepreneurs. Pitch submission required.',
    funder_priorities: ['Black-owned businesses', 'Early-stage', 'Entrepreneurship'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '19',
    title: 'Black Artists Grant (BAG)',
    funder_name: 'Creative Debuts',
    source: 'manual',
    status: 'new',
    funding_min: 500,
    funding_max: 500,
    deadline_urgency: 'no_deadline',
    combined_fit_score: 4.5,
    project_category: 'creative',
    eligibility_criteria: 'Black artists',
    blkout_alignment_notes: 'For individual artists, not organisations. Could support community members or programming. £500/month rolling.',
    funder_priorities: ['Black artists', 'Creative practice'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '20',
    title: 'Greggs Foundation Community Grants',
    funder_name: 'Greggs Foundation',
    source: 'funder_website',
    source_url: 'https://www.greggsfoundation.org.uk',
    status: 'new',
    funding_max: 20000,
    deadline_urgency: 'no_deadline',
    combined_fit_score: 6.5,
    project_category: 'capacity_building',
    eligibility_criteria: 'Community organisations',
    blkout_alignment_notes: 'Check regional rounds availability. Up to £20k/year for 2 years. Core funding for food/support work.',
    funder_priorities: ['Community organisations', 'Food and support', 'Core funding'],
    discovered_date: '2026-01-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockBidProgress: BidWritingProgress[] = [
  {
    grant_id: '1',
    grant_title: 'National Lottery Community Fund - Reaching Communities',
    funder_name: 'National Lottery Community Fund',
    amount_requested: 150000,
    deadline_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    days_until_deadline: 14,
    deadline_status: 'urgent',
    grant_status: 'preparing',
    total_documents: 6,
    drafts_in_progress: 2,
    documents_in_review: 3,
    documents_approved: 1,
    total_target_words: 8000,
    total_words_written: 5200,
    word_count_progress_pct: 65,
    total_time_spent_minutes: 720,
    total_sessions: 8,
    writing_investment_hours: 40,
    review_required: 'full_external',
  },
  {
    grant_id: '2',
    grant_title: 'Paul Hamlyn Foundation - Ideas and Pioneers',
    funder_name: 'Paul Hamlyn Foundation',
    amount_requested: 75000,
    deadline_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    days_until_deadline: 30,
    deadline_status: 'approaching',
    grant_status: 'eligible',
    total_documents: 4,
    drafts_in_progress: 3,
    documents_in_review: 1,
    documents_approved: 0,
    total_target_words: 5000,
    total_words_written: 1800,
    word_count_progress_pct: 36,
    total_time_spent_minutes: 240,
    total_sessions: 3,
    writing_investment_hours: 24,
    review_required: 'peer',
  },
  // ==================== REAL BID: Trust for London EOI ====================
  {
    grant_id: '5',
    grant_title: 'Trust for London - Racial Justice Fund (BLKOUTNXT: Economic Futures)',
    funder_name: 'Trust for London',
    amount_requested: 200000,
    grant_status: 'preparing',
    writing_investment_hours: 60,
    review_required: 'full_external',
    total_documents: 6,
    drafts_in_progress: 1,
    documents_in_review: 1,
    documents_approved: 4,
    total_target_words: 6500,
    total_words_written: 5500,
    word_count_progress_pct: 85,
    total_time_spent_minutes: 960,
    total_sessions: 12,
    deadline_status: 'on_track',
  },
];

export function useGrants() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityPipeline[]>([]);
  const [bidProgress, setBidProgress] = useState<BidWritingProgress[]>([]);
  const [pipelineSummary, setPipelineSummary] = useState<PipelineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrants = useCallback(async () => {
    try {
      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock grants data');
        return mockGrants;
      }

      const { data, error: fetchError } = await supabase
        .from('grants')
        .select('*')
        .is('deleted_at', null)
        .order('deadline_date', { ascending: true });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching grants:', err);
      return mockGrants;
    }
  }, []);

  const fetchOpportunities = useCallback(async () => {
    try {
      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock opportunities data');
        return mockOpportunities;
      }

      const { data, error: fetchError } = await supabase
        .from('opportunity_pipeline')
        .select('*');

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      return mockOpportunities;
    }
  }, []);

  const fetchBidProgress = useCallback(async () => {
    try {
      if (!isSupabaseConfigured()) {
        console.log('📦 Using mock bid progress data');
        return mockBidProgress;
      }

      const { data, error: fetchError } = await supabase
        .from('bid_writing_progress')
        .select('*');

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching bid progress:', err);
      return mockBidProgress;
    }
  }, []);

  const calculatePipelineSummary = useCallback((grantsList: Grant[]): PipelineSummary => {
    const totalRequested = grantsList.reduce((sum, g) => sum + (g.amount_requested || 0), 0);
    const totalAwarded = grantsList.reduce((sum, g) => sum + (g.amount_awarded || 0), 0);
    const awardedCount = grantsList.filter(g => g.status === 'awarded').length;
    const decidedCount = grantsList.filter(g => ['awarded', 'declined'].includes(g.status)).length;
    const activeApplications = grantsList.filter(g =>
      ['researching', 'eligible', 'preparing', 'submitted', 'under_review'].includes(g.status)
    ).length;

    // Count grants with deadlines in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const upcomingDeadlines = grantsList.filter(g => {
      if (!g.deadline_date) return false;
      const deadline = new Date(g.deadline_date);
      return deadline <= thirtyDaysFromNow && deadline >= new Date();
    }).length;

    return {
      totalGrants: grantsList.length,
      totalRequested,
      totalAwarded,
      successRate: decidedCount > 0 ? (awardedCount / decidedCount) * 100 : 0,
      activeApplications,
      upcomingDeadlines,
    };
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [grantsData, opportunitiesData, bidProgressData] = await Promise.all([
        fetchGrants(),
        fetchOpportunities(),
        fetchBidProgress(),
      ]);

      setGrants(grantsData);
      setOpportunities(opportunitiesData);
      setBidProgress(bidProgressData);
      setPipelineSummary(calculatePipelineSummary(grantsData));
    } catch (err) {
      console.error('Error fetching grant data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch grant data');
      // Use mock data as fallback
      setGrants(mockGrants);
      setOpportunities(mockOpportunities);
      setBidProgress(mockBidProgress);
      setPipelineSummary(calculatePipelineSummary(mockGrants));
    } finally {
      setLoading(false);
    }
  }, [fetchGrants, fetchOpportunities, fetchBidProgress, calculatePipelineSummary]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refetch = () => {
    fetchAll();
  };

  // Filter grants by status
  const getGrantsByStatus = useCallback((status: string | string[]) => {
    const statuses = Array.isArray(status) ? status : [status];
    return grants.filter(g => statuses.includes(g.status));
  }, [grants]);

  // Filter grants by priority
  const getGrantsByPriority = useCallback((priority: Priority | Priority[]) => {
    const priorities = Array.isArray(priority) ? priority : [priority];
    return grants.filter(g => priorities.includes(g.priority));
  }, [grants]);

  // Get upcoming deadlines
  const getUpcomingDeadlines = useCallback((days: number = 30) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    return grants
      .filter(g => {
        if (!g.deadline_date) return false;
        const deadline = new Date(g.deadline_date);
        return deadline <= cutoff && deadline >= new Date();
      })
      .sort((a, b) => {
        const dateA = new Date(a.deadline_date!).getTime();
        const dateB = new Date(b.deadline_date!).getTime();
        return dateA - dateB;
      });
  }, [grants]);

  return {
    // Data
    grants,
    opportunities,
    bidProgress,
    pipelineSummary,

    // State
    loading,
    error,

    // Actions
    refetch,

    // Utility functions
    getGrantsByStatus,
    getGrantsByPriority,
    getUpcomingDeadlines,
  };
}

// Hook for fetching a single grant with details
export function useGrant(grantId: string) {
  const [grant, setGrant] = useState<Grant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrant = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured()) {
          const mockGrant = mockGrants.find(g => g.id === grantId) || null;
          setGrant(mockGrant);
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('grants')
          .select('*')
          .eq('id', grantId)
          .is('deleted_at', null)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
        setGrant(data);
      } catch (err) {
        console.error('Error fetching grant:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch grant');
      } finally {
        setLoading(false);
      }
    };

    if (grantId) {
      fetchGrant();
    }
  }, [grantId]);

  return { grant, loading, error };
}

// Hook for bid writing templates
export function useTemplates() {
  const [templates, setTemplates] = useState<BidWritingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured()) {
          console.log('📦 Using mock templates');
          setTemplates([]);
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('bid_writing_templates')
          .select('*')
          .eq('is_active', true)
          .order('times_used', { ascending: false });

        if (fetchError) throw fetchError;
        setTemplates(data || []);
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  return { templates, loading, error };
}
