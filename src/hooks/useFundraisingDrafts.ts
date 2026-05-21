import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface FundraisingDraft {
  id: string;
  organization_id: string | null;
  partner_name: string | null;
  audience_profile: string;
  output_type: string;
  file_path: string;
  notebook_id: string | null;
  conversation_id: string | null;
  prompt_id: string | null;
  word_count: number | null;
  references_count: number | null;
  drift_summary: { PASS?: number; AMBIGUOUS?: number; DRIFT?: number; MISSING?: number };
  status: 'draft' | 'reviewed' | 'sent' | 'responded' | 'archived';
  sent_at: string | null;
  sent_to: string | null;
  response_status: string | null;
  response_at: string | null;
  notes: string | null;
  generated_at: string | null;
  // joined org fields
  org_name: string | null;
  org_type: string | null;
  is_funder: boolean | null;
  org_audience_profile: string | null;
}

export const AUDIENCE_NAMES: Record<string, string> = {
  A: 'Mental-health policy funders',
  B: 'Arts, culture, heritage funders',
  C: 'NHS, public-health, clinical',
  D: 'Peer orgs (Black, queer, equity)',
  E: 'Academic and research',
  F: 'Diasporic and international peer',
  G: 'Journalists and media',
  H: 'Individual philanthropists',
  any: 'Any audience',
};

export function useFundraisingDrafts() {
  const [drafts, setDrafts] = useState<FundraisingDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cf_fundraising_drafts_with_org')
        .select('*')
        .order('generated_at', { ascending: false });
      if (!cancelled) {
        if (error) setError(error.message);
        setDrafts((data as FundraisingDraft[] | null) ?? []);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { drafts, isLoading, error };
}
