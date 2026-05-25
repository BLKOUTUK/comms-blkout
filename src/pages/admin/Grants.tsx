/**
 * /admin/grants → /admin/fundraising
 * Grants page is consolidated into the Funding hub since 24 May 2026.
 * Old route redirects to the hub to preserve bookmarks.
 */
import { Navigate } from 'react-router-dom';

export default function Grants() {
  return <Navigate to="/admin/fundraising" replace />;
}
