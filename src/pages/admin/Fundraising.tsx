/**
 * Fundraising → FundingHub
 * /admin/fundraising is the unified funding hub since 24 May 2026.
 * Combines bid pipeline (was /admin/grants) and Critical Frequency outreach.
 */
import FundingHub from './funding/FundingHub';

export function Fundraising() {
  return <FundingHub />;
}

export default Fundraising;
