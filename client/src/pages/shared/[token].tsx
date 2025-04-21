import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Timeline from '../../components/timeline/timeline';
import TimelineHeader from '../../components/timeline/timeline-header';
import { toast } from 'sonner';

interface SharedTimeline {
  id: number;
  name: string;
  weddingDate: string;
  coupleName: string;
  events: Array<{
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    description: string;
    location: string;
    color: string;
  }>;
}

export default function SharedTimelineView() {
  const { token } = useParams<{ token: string }>();
  const [timeline, setTimeline] = useState<SharedTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedTimeline = async () => {
      try {
        const response = await fetch(`/api/shared/${token}`);
        if (!response.ok) {
          throw new Error('Failed to load shared timeline');
        }
        const data = await response.json();
        setTimeline(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load timeline');
        toast.error('Failed to load shared timeline');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSharedTimeline();
    }
  }, [token]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error || !timeline) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error || 'Timeline not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TimelineHeader
          coupleName={timeline.coupleName}
          weddingDate={timeline.weddingDate}
          showRestrictions={false}
        />
        <div className="mt-8">
          <Timeline
            events={timeline.events}
            onEventUpdate={() => {}}
            onEventDelete={() => {}}
            isSharedView={true}
          />
        </div>
      </div>
    </div>
  );
} 