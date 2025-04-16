import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';

export function useWeddingTimeline(timelineId: number) {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  // Fetch the timeline data
  const { data: timeline, isLoading: isTimelineLoading } = useQuery({
    queryKey: [`/api/wedding-timelines/single/${timelineId}`],
  });

  // Fetch the timeline events
  const { data: events, isLoading: isEventsLoading } = useQuery({
    queryKey: [`/api/timeline-events/${timelineId}`],
  });

  // Fetch venue restrictions
  const { data: restrictions, isLoading: isRestrictionsLoading } = useQuery({
    queryKey: [`/api/venue-restrictions/${timelineId}`],
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PUT', `/api/timeline-events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/timeline-events/${timelineId}`] });
    }
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/timeline-events', {
        ...data,
        userId: 1, // Using the default user ID
        position: events?.length ? events.length + 1 : 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/timeline-events/${timelineId}`] });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/timeline-events/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/timeline-events/${timelineId}`] });
      setSelectedEventId(null);
    }
  });

  const updateTimelineMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/wedding-timelines/${timelineId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wedding-timelines/single/${timelineId}`] });
    }
  });

  const updateVenueRestrictionsMutation = useMutation({
    mutationFn: async (data: any) => {
      if (restrictions) {
        return apiRequest('PUT', `/api/venue-restrictions/${timelineId}`, data);
      } else {
        return apiRequest('POST', '/api/venue-restrictions', {
          ...data,
          timelineId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/venue-restrictions/${timelineId}`] });
    }
  });

  const isLoading = isTimelineLoading || isEventsLoading || isRestrictionsLoading;

  return {
    timeline,
    events,
    restrictions,
    isLoading,
    selectedEventId,
    setSelectedEventId,
    updateEvent: (id: number, data: any) => updateEventMutation.mutate({ id, data }),
    createEvent: (data: any) => createEventMutation.mutate(data),
    deleteEvent: (id: number) => deleteEventMutation.mutate(id),
    updateTimeline: (data: any) => updateTimelineMutation.mutate(data),
    updateVenueRestrictions: (data: any) => updateVenueRestrictionsMutation.mutate(data)
  };
}
