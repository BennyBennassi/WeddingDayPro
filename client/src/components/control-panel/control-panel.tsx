import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import AddTimeBlockForm from './add-event-form';
import EditTimeBlockForm from './edit-event-form';
import TimelineSettings from './timeline-settings';
import VenueRestrictions from './venue-restrictions';
import ExportOptions from './export-options';
import AuthModal from '@/components/auth/auth-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ControlPanelProps {
  timeline: any;
  events: any[];
  venueRestrictions: any;
  selectedEventId: number | null;
  setSelectedEventId: (id: number | null) => void;
  handleExportPdf: () => void;
  userTimelines?: any[];
  selectedTimelineId?: number | null;
  setSelectedTimelineId?: (id: number) => void;
  handleCreateTimeline?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  timeline,
  events,
  venueRestrictions,
  selectedEventId,
  setSelectedEventId,
  handleExportPdf,
  userTimelines,
  selectedTimelineId,
  setSelectedTimelineId,
  handleCreateTimeline
}) => {
  const { user } = useAuth();
  const selectedEvent = events?.find(event => event.id === selectedEventId);
  const selectedBlockRef = useRef<HTMLDivElement>(null);
  
  // Scroll to the selected block section when a block is selected
  useEffect(() => {
    if (selectedEventId && selectedBlockRef.current) {
      // Scroll the selected block section into view with smooth behavior
      selectedBlockRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selectedEventId]);
  
  const updateTimelineMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/wedding-timelines/${timeline?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wedding-timelines/single/${timeline?.id}`] });
    }
  });
  
  const updateVenueRestrictionsMutation = useMutation({
    mutationFn: async (data: any) => {
      if (venueRestrictions) {
        return apiRequest('PUT', `/api/venue-restrictions/${timeline?.id}`, data);
      } else {
        return apiRequest('POST', `/api/venue-restrictions`, {
          ...data,
          timelineId: timeline?.id
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/venue-restrictions/${timeline?.id}`] });
    }
  });

  const handleTimelineSettingsUpdate = (data: any) => {
    updateTimelineMutation.mutate(data);
  };

  const handleVenueRestrictionsUpdate = (data: any) => {
    updateVenueRestrictionsMutation.mutate(data);
  };

  const loadTemplate = async (templateType: string) => {
    let templateEvents = [];
    
    switch (templateType) {
      case 'church':
        templateEvents = [
          { name: "Hair & Makeup", startTime: "08:00", endTime: "12:00", category: "morning_prep", color: "bg-pink-100", notes: "", position: 1 },
          { name: "Travel to Church", startTime: "12:15", endTime: "12:30", category: "travel", color: "bg-blue-100", notes: "", position: 2 },
          { name: "Church Ceremony", startTime: "13:00", endTime: "14:00", category: "ceremony", color: "bg-primary-light", notes: "", position: 3 },
          { name: "Photos at Church", startTime: "14:00", endTime: "14:30", category: "photos", color: "bg-green-100", notes: "", position: 4 },
          { name: "Travel to Reception", startTime: "14:30", endTime: "15:00", category: "travel", color: "bg-blue-100", notes: "", position: 5 },
          { name: "Drinks Reception", startTime: "15:30", endTime: "17:00", category: "drinks_reception", color: "bg-yellow-100", notes: "", position: 6 },
          { name: "Bell Call", startTime: "17:00", endTime: "17:30", category: "bell_call", color: "bg-orange-100", notes: "", position: 7 },
          { name: "Dinner Service", startTime: "17:30", endTime: "19:30", category: "dining", color: "bg-red-100", notes: "", position: 8 },
          { name: "Speeches", startTime: "19:30", endTime: "20:00", category: "speeches", color: "bg-accent-light", notes: "", position: 9 },
          { name: "Band", startTime: "21:00", endTime: "23:30", category: "entertainment", color: "bg-indigo-100", notes: "", position: 10 },
          { name: "DJ", startTime: "23:30", endTime: "01:30", category: "dancing", color: "bg-indigo-100", notes: "", position: 11 },
        ];
        break;
      case 'single-venue':
        templateEvents = [
          { name: "Hair & Makeup", startTime: "10:00", endTime: "13:00", category: "morning_prep", color: "bg-pink-100", notes: "", position: 1 },
          { name: "Ceremony", startTime: "14:00", endTime: "15:00", category: "ceremony", color: "bg-primary-light", notes: "", position: 2 },
          { name: "Drinks Reception", startTime: "15:00", endTime: "17:00", category: "drinks_reception", color: "bg-yellow-100", notes: "", position: 3 },
          { name: "Photos", startTime: "15:15", endTime: "16:30", category: "photos", color: "bg-green-100", notes: "", position: 4 },
          { name: "Bell Call", startTime: "17:00", endTime: "17:30", category: "bell_call", color: "bg-orange-100", notes: "", position: 5 },
          { name: "Dinner Service", startTime: "17:30", endTime: "19:30", category: "dining", color: "bg-red-100", notes: "", position: 6 },
          { name: "Speeches", startTime: "19:30", endTime: "20:15", category: "speeches", color: "bg-accent-light", notes: "", position: 7 },
          { name: "Band Setup", startTime: "20:15", endTime: "21:00", category: "entertainment", color: "bg-gray-200", notes: "", position: 8 },
          { name: "First Dance", startTime: "21:00", endTime: "21:15", category: "dancing", color: "bg-purple-100", notes: "", position: 9 },
          { name: "Band", startTime: "21:15", endTime: "23:45", category: "entertainment", color: "bg-indigo-100", notes: "", position: 10 },
          { name: "DJ", startTime: "23:45", endTime: "01:30", category: "dancing", color: "bg-indigo-100", notes: "", position: 11 },
        ];
        break;
      case 'morning-ceremony':
        templateEvents = [
          { name: "Hair & Makeup", startTime: "05:00", endTime: "08:00", category: "morning_prep", color: "bg-pink-100", notes: "", position: 1 },
          { name: "Ceremony", startTime: "09:00", endTime: "10:00", category: "ceremony", color: "bg-primary-light", notes: "", position: 2 },
          { name: "Photos", startTime: "10:00", endTime: "11:30", category: "photos", color: "bg-green-100", notes: "", position: 3 },
          { name: "Brunch", startTime: "11:30", endTime: "13:30", category: "dining", color: "bg-red-100", notes: "", position: 4 },
          { name: "Afternoon Activities", startTime: "13:30", endTime: "16:00", category: "entertainment", color: "bg-yellow-100", notes: "", position: 5 },
          { name: "Bell Call", startTime: "17:00", endTime: "17:30", category: "bell_call", color: "bg-orange-100", notes: "", position: 6 },
          { name: "Dinner Service", startTime: "17:30", endTime: "19:30", category: "dining", color: "bg-red-100", notes: "", position: 7 },
          { name: "Evening Entertainment", startTime: "20:00", endTime: "00:00", category: "dancing", color: "bg-indigo-100", notes: "", position: 8 },
        ];
        break;
      case 'evening-ceremony':
        templateEvents = [
          { name: "Hair & Makeup", startTime: "13:00", endTime: "16:00", category: "morning_prep", color: "bg-pink-100", notes: "", position: 1 },
          { name: "Ceremony", startTime: "17:00", endTime: "18:00", category: "ceremony", color: "bg-primary-light", notes: "", position: 2 },
          { name: "Drinks Reception", startTime: "18:00", endTime: "19:00", category: "drinks_reception", color: "bg-yellow-100", notes: "", position: 3 },
          { name: "Photos", startTime: "18:15", endTime: "19:00", category: "photos", color: "bg-green-100", notes: "", position: 4 },
          { name: "Dinner Service", startTime: "19:00", endTime: "21:00", category: "dining", color: "bg-red-100", notes: "", position: 5 },
          { name: "Speeches", startTime: "21:00", endTime: "21:30", category: "speeches", color: "bg-accent-light", notes: "", position: 6 },
          { name: "Dancing", startTime: "21:30", endTime: "01:30", category: "dancing", color: "bg-indigo-100", notes: "", position: 7 },
          { name: "Late Night Snacks", startTime: "23:00", endTime: "23:30", category: "dining", color: "bg-orange-100", notes: "", position: 8 },
        ];
        break;
      default:
        return;
    }
    
    // Delete existing events
    for (const event of events || []) {
      await apiRequest('DELETE', `/api/timeline-events/${event.id}`, null);
    }
    
    // Create new events from template
    for (const event of templateEvents) {
      await apiRequest('POST', '/api/timeline-events', {
        ...event,
        userId: 1 // Using the default user
      });
    }
    
    // Refresh events
    queryClient.invalidateQueries({ queryKey: [`/api/timeline-events/${timeline?.id}`] });
  };

  return (
    <div className="control-panel">
      <h2 className="text-xl font-medium text-gray-800 mb-6">Timeline Controls</h2>
      
      {/* Timeline Management Section */}
      {user ? (
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-3">Your Timelines</h3>
          
          {/* Timeline Selector - only shows when user has timelines */}
          {userTimelines && Array.isArray(userTimelines) && userTimelines.length > 0 ? (
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <Select
                  value={selectedTimelineId?.toString()}
                  onValueChange={setSelectedTimelineId ? (value) => setSelectedTimelineId(parseInt(value)) : undefined}
                  disabled={!setSelectedTimelineId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {userTimelines.map((t: any) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {handleCreateTimeline && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCreateTimeline}
                    title="Create new timeline"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* New Timeline Form - shows when user has no timelines */
            <div className="space-y-3 p-4 bg-gray-50 rounded border border-gray-200">
              <p className="text-sm text-gray-500">You don't have any timelines yet. Create your first timeline:</p>
              {handleCreateTimeline && (
                <Button
                  variant="default"
                  onClick={handleCreateTimeline}
                  className="w-full"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Timeline
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Not logged in message */
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-3">Your Timelines</h3>
          <div className="p-4 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm text-gray-500 mb-3">You need to be logged in to create and manage timelines</p>
            <AuthModal 
              triggerButton={
                <Button variant="default" className="w-full">
                  Login / Register
                </Button>
              }
            />
          </div>
        </div>
      )}
      
      {/* Timeline Settings */}
      <TimelineSettings 
        timeline={timeline} 
        onUpdate={handleTimelineSettingsUpdate} 
      />
      
      {/* Venue Restrictions - Moved below Timeline Settings */}
      <VenueRestrictions 
        restrictions={venueRestrictions} 
        onUpdate={handleVenueRestrictionsUpdate} 
      />
      
      {/* Create New Block of Time */}
      <div className="mb-8">
        <h3 className="text-md font-medium text-gray-700 mb-4">Add New Block of Time</h3>
        <AddTimeBlockForm timelineId={timeline?.id} />
      </div>
      
      {/* Currently Selected Block of Time */}
      {selectedEvent ? (
        <div ref={selectedBlockRef} className="mb-8 bg-gray-50 p-4 rounded-lg border-2 border-primary animate-pulse-light">
          <h3 className="text-md font-medium text-gray-700 mb-4">Selected Block of Time</h3>
          <EditTimeBlockForm 
            event={selectedEvent} 
            onClose={() => setSelectedEventId(null)} 
          />
        </div>
      ) : (
        <div className="mb-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-medium text-gray-700 mb-4">Selected Block of Time</h3>
          <p className="text-sm text-gray-500 mb-4">Click on a block of time in the timeline to edit it</p>
        </div>
      )}
      
      {/* Template Options */}
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-700 mb-4">Templates</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-md text-sm font-medium transition-colors"
            onClick={() => loadTemplate('church')}
          >
            Church Wedding
          </button>
          <button 
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-md text-sm font-medium transition-colors"
            onClick={() => loadTemplate('single-venue')}
          >
            Single Venue
          </button>
          <button 
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-md text-sm font-medium transition-colors"
            onClick={() => loadTemplate('morning-ceremony')}
          >
            Morning Ceremony
          </button>
          <button 
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-md text-sm font-medium transition-colors"
            onClick={() => loadTemplate('evening-ceremony')}
          >
            Evening Ceremony
          </button>
        </div>
      </div>
      
      {/* Export Options */}
      <ExportOptions handleExportPdf={handleExportPdf} />
    </div>
  );
};

export default ControlPanel;
