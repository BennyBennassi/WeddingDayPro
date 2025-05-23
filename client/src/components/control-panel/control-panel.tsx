import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useWeddingTimeline } from '@/hooks/use-wedding-timeline';
import { debounce } from '@/lib/utils';
import AddTimeBlockForm from './add-event-form';
import EditTimeBlockForm from './edit-event-form';
import TimelineSettings from './timeline-settings';
import TimeRestrictions from './time-restrictions';
import TemplateSelector from './template-selector';
import ExportOptions from './export-options';
import AuthModal from '@/components/auth/auth-modal';
import CollapsibleSection from '@/components/ui/collapsible-section';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ControlPanelProps {
  timeline: any;
  events: any[];
  venueRestrictions: any; // Keep this name for API compatibility
  selectedEventId: number | null;
  setSelectedEventId: (id: number | null) => void;
  handleExportPdf: () => void;
  userTimelines?: any[];
  selectedTimelineId?: number | null;
  setSelectedTimelineId?: (id: number) => void;
  handleCreateTimeline?: () => void;
  setTimelineModified?: (value: boolean) => void;
  isMobile?: boolean;
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
  handleCreateTimeline,
  setTimelineModified,
  isMobile = false
}) => {
  const { user } = useAuth();
  const selectedEvent = events?.find(event => event.id === selectedEventId);
  const selectedBlockRef = useRef<HTMLDivElement>(null);
  const [weddingCoupleValue, setWeddingCoupleValue] = useState(timeline?.weddingCouple || '');
  const [weddingDateValue, setWeddingDateValue] = useState(timeline?.weddingDate || '');
  
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
  
  // Update local state when timeline changes
  useEffect(() => {
    if (timeline) {
      setWeddingCoupleValue(timeline.weddingCouple || '');
      setWeddingDateValue(timeline.weddingDate || '');
    }
  }, [timeline]);
  
  const updateTimelineMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/wedding-timelines/${timeline?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/wedding-timelines/single/${timeline?.id}`] });
    }
  });
  
  // Debounced handlers for wedding details
  
  // Create debounced handler for wedding date field
  const debouncedUpdateWeddingDate = useCallback(
    debounce((value: string) => {
      // Mark timeline as modified when updating wedding date
      if (setTimelineModified) {
        setTimelineModified(true);
      }
      updateTimelineMutation.mutate({ weddingDate: value });
    }, 500),
    [updateTimelineMutation, setTimelineModified]
  );
  
  // Create debounced handler for wedding couple field
  const debouncedUpdateWeddingCouple = useCallback(
    debounce((value: string) => {
      // Mark timeline as modified when updating wedding couple
      if (setTimelineModified) {
        setTimelineModified(true);
      }
      updateTimelineMutation.mutate({ weddingCouple: value });
    }, 500),
    [updateTimelineMutation, setTimelineModified]
  );
  
  const updateTimeRestrictionsMutation = useMutation({
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
  
  const { toast } = useToast();
  
  // Delete timeline mutation
  const deleteTimelineMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/wedding-timelines/${timeline?.id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wedding-timelines'] });
      toast({
        title: "Timeline deleted",
        description: "Your timeline has been successfully deleted.",
      });
      
      // If there are other timelines, select the first one
      if (userTimelines && userTimelines.length > 1 && setSelectedTimelineId) {
        const remainingTimelines = userTimelines.filter(t => t.id !== timeline?.id);
        if (remainingTimelines.length > 0) {
          setSelectedTimelineId(remainingTimelines[0].id);
        }
      } else if (handleCreateTimeline) {
        // If this was the last timeline, create a new one
        handleCreateTimeline();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting timeline",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Clear timeline events mutation
  const clearAllTimelineDataMutation = useMutation({
    mutationFn: async () => {
      // Make sure timeline ID is valid before making the request
      if (!timeline?.id) {
        throw new Error("No active timeline selected");
      }
      return apiRequest('DELETE', `/api/timelines/${timeline.id}/all-data`, null);
    },
    onSuccess: () => {
      // Invalidate all the relevant queries for this timeline
      queryClient.invalidateQueries({ queryKey: [`/api/timeline-events/${timeline?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/venue-restrictions/${timeline?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user-question-responses/${user?.id}/${timeline?.id}`] });
      
      // Force a refresh of the timeline view by setting events to empty array directly
      queryClient.setQueryData([`/api/timeline-events/${timeline?.id}`], []);
      
      // Also clear venue restrictions from the cache
      queryClient.setQueryData([`/api/venue-restrictions/${timeline?.id}`], null);
      
      toast({
        title: "Timeline fully cleared",
        description: "All events, time restrictions, and 'Things to Consider' responses have been cleared.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error clearing timeline",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleTimelineSettingsUpdate = (data: any) => {
    // Mark timeline as modified when updating timeline settings
    if (setTimelineModified) {
      setTimelineModified(true);
    }
    updateTimelineMutation.mutate(data);
  };

  const handleTimeRestrictionsUpdate = (data: any) => {
    // Mark timeline as modified when updating venue restrictions
    if (setTimelineModified) {
      setTimelineModified(true);
    }
    updateTimeRestrictionsMutation.mutate(data);
  };
  
  const handleDeleteTimeline = () => {
    deleteTimelineMutation.mutate();
  };
  
  const handleClearTimeline = () => {
    // Mark timeline as modified when clearing timeline
    if (setTimelineModified) {
      setTimelineModified(true);
    }
    clearAllTimelineDataMutation.mutate();
  };

  const loadTemplate = async (templateType: string) => {
    // Make sure timeline ID is valid before making the request
    if (!timeline?.id) {
      toast({
        title: "Cannot apply template",
        description: "No active timeline selected",
        variant: "destructive",
      });
      return;
    }
    
    // Mark timeline as modified when applying a template
    if (setTimelineModified) {
      setTimelineModified(true);
    }
    
    type TemplateEvent = {
      name: string;
      startTime: string;
      endTime: string;
      category: string;
      color: string;
      notes: string;
      position: number;
    };
    
    let templateEvents: TemplateEvent[] = [];
    
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
        ];
        break;
      default:
        break;
    }
    
    // Clear existing timeline events
    await clearAllTimelineDataMutation.mutateAsync();
    
    // Create new events from the template
    for (const event of templateEvents) {
      await apiRequest('POST', '/api/timeline-events', {
        ...event,
        timelineId: timeline?.id
      });
    }
    
    // Invalidate the events query to refresh the timeline
    queryClient.invalidateQueries({ queryKey: [`/api/timeline-events/${timeline?.id}`] });
    
    toast({
      title: "Template Applied",
      description: `The ${templateType} template has been applied to your timeline.`,
    });
  };

  return (
    <div className="control-panel">
      {isMobile ? (
        // Mobile view with collapsible sections
        <>
          {/* Wedding Details */}
          {timeline && (
            <CollapsibleSection title="Wedding Details" defaultOpen={true}>
              <div className="space-y-3">
                <div>
                  <label htmlFor="wedding-couple-mobile" className="block text-sm text-gray-600 mb-1">Wedding Couple</label>
                  <input 
                    id="wedding-couple-mobile"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Mary & John"
                    maxLength={30}
                    value={weddingCoupleValue}
                    onChange={(e) => {
                      setWeddingCoupleValue(e.target.value);
                      debouncedUpdateWeddingCouple(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="wedding-date-mobile" className="block text-sm text-gray-600 mb-1">Wedding Date</label>
                  <input 
                    id="wedding-date-mobile"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={weddingDateValue}
                    onChange={(e) => {
                      setWeddingDateValue(e.target.value);
                      debouncedUpdateWeddingDate(e.target.value);
                    }}
                  />
                </div>
              </div>
            </CollapsibleSection>
          )}
          
          {/* Timeline Management Section */}
          {user && (
            <CollapsibleSection title="Your Timelines" defaultOpen={true}>
              {userTimelines && Array.isArray(userTimelines) && userTimelines.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <Select
                      value={selectedTimelineId?.toString()}
                      onValueChange={setSelectedTimelineId ? (value) => setSelectedTimelineId(parseInt(value)) : undefined}
                      disabled={!setSelectedTimelineId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a Timeline" />
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
                        size="icon"
                        variant="outline"
                        onClick={handleCreateTimeline}
                        title="Create New Timeline"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  {handleCreateTimeline && (
                    <Button onClick={handleCreateTimeline} className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Timeline
                    </Button>
                  )}
                </div>
              )}
            </CollapsibleSection>
          )}
          
          {/* Timeline Settings */}
          <CollapsibleSection title="Timeline Settings">
            <TimelineSettings 
              timeline={timeline} 
              onUpdate={handleTimelineSettingsUpdate}
              onDeleteTimeline={user ? handleDeleteTimeline : undefined}
              onClearTimeline={user ? handleClearTimeline : undefined}
              isDeleting={deleteTimelineMutation.isPending}
              isClearing={clearAllTimelineDataMutation.isPending}
            />
          </CollapsibleSection>
          
          {/* Time Restrictions */}
          <CollapsibleSection title="Venue Restrictions">
            <TimeRestrictions 
              restrictions={venueRestrictions} 
              onUpdate={handleTimeRestrictionsUpdate} 
            />
          </CollapsibleSection>
          
          {/* Add New Block of Time */}
          <CollapsibleSection title="Add New Block of Time" defaultOpen={!selectedEvent}>
            <AddTimeBlockForm 
              timelineId={timeline?.id}
              setTimelineModified={setTimelineModified}
            />
          </CollapsibleSection>
          
          {/* Edit Selected Block */}
          {selectedEvent && (
            <CollapsibleSection title="Edit Selected Block" defaultOpen={true}>
              <div ref={selectedBlockRef}>
                <EditTimeBlockForm 
                  event={selectedEvent}
                  onClose={() => setSelectedEventId(null)}
                  setTimelineModified={setTimelineModified}
                />
              </div>
            </CollapsibleSection>
          )}
          
          {/* Template Selector */}
          <CollapsibleSection title="Templates">
            <TemplateSelector onSelectTemplate={loadTemplate} />
          </CollapsibleSection>
          
          {/* Export Options */}
          <CollapsibleSection title="Export">
            <ExportOptions handleExportPdf={handleExportPdf} />
          </CollapsibleSection>
        </>
      ) : (
        // Desktop view
        <>
          <h2 className="text-xl font-medium text-gray-800 mb-6">Timeline Controls</h2>
          
          {/* Wedding Of & Date Fields */}
          {timeline && (
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 mb-3">Wedding Details</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="wedding-couple" className="block text-sm text-gray-600 mb-1">Wedding Couple</label>
                  <input 
                    id="wedding-couple"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Mary & John"
                    maxLength={30}
                    value={weddingCoupleValue}
                    onChange={(e) => {
                      setWeddingCoupleValue(e.target.value);
                      debouncedUpdateWeddingCouple(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="wedding-date" className="block text-sm text-gray-600 mb-1">Wedding Date</label>
                  <input 
                    id="wedding-date"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={weddingDateValue}
                    onChange={(e) => {
                      setWeddingDateValue(e.target.value);
                      debouncedUpdateWeddingDate(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          
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
                        <SelectValue placeholder="Select a Timeline" />
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
            onDeleteTimeline={user ? handleDeleteTimeline : undefined}
            onClearTimeline={user ? handleClearTimeline : undefined}
            isDeleting={deleteTimelineMutation.isPending}
            isClearing={clearAllTimelineDataMutation.isPending}
          />
          
          {/* Time Restrictions - Moved below Timeline Settings */}
          <TimeRestrictions 
            restrictions={venueRestrictions} 
            onUpdate={handleTimeRestrictionsUpdate} 
          />
          
          {/* Create New Block of Time */}
          <div className="mb-8">
            <h3 className="text-md font-medium text-gray-700 mb-4">Add New Block of Time</h3>
            <AddTimeBlockForm 
              timelineId={timeline?.id} 
              setTimelineModified={setTimelineModified} 
            />
          </div>
          
          {/* Currently Selected Block of Time */}
          {selectedEvent ? (
            <div ref={selectedBlockRef} className="mb-8 bg-gray-50 p-4 rounded-lg border-2 border-primary animate-pulse-light">
              <h3 className="text-md font-medium text-gray-700 mb-4">Selected Block of Time</h3>
              <EditTimeBlockForm 
                event={selectedEvent} 
                onClose={() => setSelectedEventId(null)}
                setTimelineModified={setTimelineModified}
              />
            </div>
          ) : (
            <div className="mb-8 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-gray-700 mb-4">Selected Block of Time</h3>
              <p className="text-sm text-gray-500 mb-4">Click on a block of time in the timeline to edit it</p>
            </div>
          )}
          
          {/* Template Selector */}
          <TemplateSelector onSelectTemplate={loadTemplate} />
          
          {/* Export Options */}
          <ExportOptions handleExportPdf={handleExportPdf} />
        </>
      )}
    </div>
  );
};

export default ControlPanel;