
import { DraftList } from '../../components/admin/DraftList';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { useContent } from '../../hooks/useContent';
import { supabase } from '../../lib/supabase';

export function DraftsPage() {
  const { content, loading, error, refetch } = useContent({
    status: ['draft', 'review'],
  });

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_calendar')
        .update({ status: 'approved' })
        .eq('id', id);
      
      if (error) throw error;
      refetch();
    } catch (err) {
      console.error('Error approving draft:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_calendar')
        .update({ status: 'draft' })
        .eq('id', id);
      
      if (error) throw error;
      refetch();
    } catch (err) {
      console.error('Error rejecting draft:', err);
    }
  };

  const handleEdit = (id: string) => {
    // In a real app, this would navigate to an edit page
    console.log('Edit draft:', id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Draft Management</h1>
        <button className="btn-primary">
          New Content
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-red-600">Error loading drafts: {error.message}</p>
        </div>
      ) : (
        <DraftList
          drafts={content}
          onApprove={handleApprove}
          onReject={handleReject}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}
