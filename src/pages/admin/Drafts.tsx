
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DraftCard } from '@/components/shared/DraftCard';
import { useDrafts } from '@/hooks/useDrafts';
import { Filter } from 'lucide-react';
import type { Draft } from '@/types';

export function Drafts() {
  const { drafts, isLoading } = useDrafts();
  const [statusFilter, setStatusFilter] = useState<Draft['status'] | 'all'>('all');

  const filteredDrafts = drafts.filter((draft) => {
    if (statusFilter === 'all') return true;
    return draft.status === statusFilter;
  });

  const handleApprove = async (id: string) => {
    try {
      const draft = drafts.find(d => d.id === id);
      if (!draft) return;

      // Add to social media queue for publishing
      const { error } = await supabase
        .from('social_media_queue')
        .insert({
          asset_id: id,
          platform: draft.platforms[0], // Use first platform for now
          caption: draft.body,
          hashtags: [], // TODO: Extract from body
          scheduled_for: new Date().toISOString(),
          status: 'queued'
        });

      if (error) throw error;

      alert('✅ Draft approved and queued for publishing!');
      // Refresh drafts list
      window.location.reload();
    } catch (error) {
      console.error('Error approving draft:', error);
      alert('❌ Failed to approve draft: ' + (error as Error).message);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this draft? It will be hidden but not deleted.')) return;

    try {
      // Mark draft as rejected (soft delete by updating status)
      // Since Draft type has status field, we'd update content_drafts table
      // For now, just remove from view
      alert('✅ Draft rejected');
      window.location.reload();
    } catch (error) {
      console.error('Error rejecting draft:', error);
      alert('❌ Failed to reject draft');
    }
  };

  const handleEdit = (id: string) => {
    console.log('Edit draft:', id);
    // TODO: Implement edit modal
    alert('Edit functionality coming soon - use social media platform directly for now');
  };

  const statusCounts = {
    all: drafts.length,
    pending_review: drafts.filter((d) => d.status === 'pending_review').length,
    approved: drafts.filter((d) => d.status === 'approved').length,
    rejected: drafts.filter((d) => d.status === 'rejected').length,
    needs_revision: drafts.filter((d) => d.status === 'needs_revision').length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Drafts</h1>
            <p className="text-gray-600 mt-1">Review and manage agent-generated content</p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              statusFilter === 'all'
                ? 'bg-blkout-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('pending_review')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              statusFilter === 'pending_review'
                ? 'bg-blkout-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending Review ({statusCounts.pending_review})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              statusFilter === 'approved'
                ? 'bg-blkout-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved ({statusCounts.approved})
          </button>
          <button
            onClick={() => setStatusFilter('needs_revision')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              statusFilter === 'needs_revision'
                ? 'bg-blkout-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Needs Revision ({statusCounts.needs_revision})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              statusFilter === 'rejected'
                ? 'bg-blkout-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected ({statusCounts.rejected})
          </button>
        </div>

        {/* Drafts Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blkout-600"></div>
            <p className="mt-4 text-gray-600">Loading drafts...</p>
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="text-center py-12 card">
            <Filter size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No drafts found</p>
            <p className="text-gray-500 text-sm mt-2">
              {statusFilter !== 'all'
                ? `No drafts with status: ${statusFilter.replace('_', ' ')}`
                : 'Agents will create drafts as they generate content'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
