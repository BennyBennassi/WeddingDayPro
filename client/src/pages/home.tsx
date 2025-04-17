import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import Timeline from "@/components/timeline/timeline";
import ControlPanel from "@/components/control-panel/control-panel";
import AuthModal from "@/components/auth/auth-modal";
import ThingsToConsider from "@/components/timeline-questions/things-to-consider";
import { Button } from "@/components/ui/button";
import { Save, Share, UserCog, PlusCircle } from "lucide-react";
import { usePdfExport } from "@/lib/exportPdf";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HomeProps {
  provideSaveHandler?: (handler: () => void) => void;
  provideShareHandler?: (handler: () => void) => void;
}

function Home({ provideSaveHandler, provideShareHandler }: HomeProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTimelineId, setSelectedTimelineId] = useState<number | null>(1); // Default to 1 for now
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showNewTimelineDialog, setShowNewTimelineDialog] = useState(false);
  const [newTimelineName, setNewTimelineName] = useState("");
  const [newTimelineDate, setNewTimelineDate] = useState("");
  const [hasLoadedDefaultTemplate, setHasLoadedDefaultTemplate] = useState(false);
  
  // State for timeline switching
  const [showSaveChangesDialog, setShowSaveChangesDialog] = useState(false);
  const [pendingTimelineId, setPendingTimelineId] = useState<number | null>(null);
  const { generatePdf } = usePdfExport();
  
  // Fetch user's timelines
  const { data: userTimelines, isLoading: isUserTimelinesLoading } = useQuery({
    queryKey: ['/api/wedding-timelines'],
    enabled: !!user, // Only run this query if user is logged in
  });

  // Fetch the timeline data
  const { data: timeline, isLoading: isTimelineLoading } = useQuery({
    queryKey: [`/api/wedding-timelines/single/${selectedTimelineId}`],
  });

  // Fetch the timeline events
  const { data: events, isLoading: isEventsLoading } = useQuery({
    queryKey: [`/api/timeline-events/${selectedTimelineId}`],
  });

  // Fetch venue restrictions
  const { data: restrictions, isLoading: isRestrictionsLoading } = useQuery({
    queryKey: [`/api/venue-restrictions/${selectedTimelineId}`],
  });
  
  // Mutation to add new event
  const addEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const res = await apiRequest('POST', '/api/timeline-events', eventData);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to add event' }));
        throw new Error(errorData.message || 'Failed to add event');
      }
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate events query to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/timeline-events/${selectedTimelineId}`] });
      toast({
        title: 'Event Added',
        description: 'The event has been added to your timeline.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add event',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for creating a new timeline
  const createTimelineMutation = useMutation({
    mutationFn: async (timelineData: any) => {
      const res = await apiRequest('POST', '/api/wedding-timelines', timelineData);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to create timeline' }));
        throw new Error(errorData.message || 'Failed to create timeline');
      }
      return await res.json();
    },
    onSuccess: (newTimeline) => {
      queryClient.invalidateQueries({ queryKey: ['/api/wedding-timelines'] });
      setSelectedTimelineId(newTimeline.id);
      setShowNewTimelineDialog(false);
      setNewTimelineName("");
      setNewTimelineDate("");
      toast({
        title: 'Timeline Created',
        description: `"${newTimeline.name}" has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create timeline',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle timeline saving
  const handleSave = () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    
    toast({
      title: "Timeline Saved",
      description: "Your wedding timeline has been saved successfully.",
    });
    
    // If there's a pending timeline switch after saving, perform it now
    if (pendingTimelineId !== null) {
      const timelineToSwitch = pendingTimelineId;
      setPendingTimelineId(null);
      setSelectedTimelineId(timelineToSwitch);
    }
  };
  
  // Override the setSelectedTimelineId from useState to add saving confirmation
  const handleTimelineChange = (newTimelineId: number) => {
    // Don't do anything if trying to switch to the current timeline
    if (newTimelineId === selectedTimelineId) return;
    
    // Show save changes dialog
    setPendingTimelineId(newTimelineId);
    setShowSaveChangesDialog(true);
  };
  
  // Handle creating a new timeline
  const handleCreateTimeline = () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    
    // Generate a timeline name with TL prefix and number
    // Find the highest TL number from existing timelines to ensure continuous numbering
    let highestTLNumber = 0;
    
    if (userTimelines && Array.isArray(userTimelines) && userTimelines.length > 0) {
      userTimelines.forEach((timeline: any) => {
        if (timeline.name) {
          const match = timeline.name.match(/^TL(\d+) -/);
          if (match && match[1]) {
            const tlNumber = parseInt(match[1]);
            if (tlNumber > highestTLNumber) {
              highestTLNumber = tlNumber;
            }
          }
        }
      });
    }
    
    const timelinePrefix = `TL${highestTLNumber + 1} - `;
    const defaultName = "New Timeline";
    
    // Set default values
    setNewTimelineName(defaultName);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    setNewTimelineDate(today);
    
    // Show create dialog
    setShowNewTimelineDialog(true);
  };
  
  // Submit new timeline
  const handleSubmitNewTimeline = () => {
    if (!user) return;
    
    // Generate the timeline name with the proper TL number prefix
    // Find the highest TL number from existing timelines
    let highestTLNumber = 0;
    
    if (userTimelines && Array.isArray(userTimelines) && userTimelines.length > 0) {
      userTimelines.forEach((timeline: any) => {
        if (timeline.name) {
          const match = timeline.name.match(/^TL(\d+) -/);
          if (match && match[1]) {
            const tlNumber = parseInt(match[1]);
            if (tlNumber > highestTLNumber) {
              highestTLNumber = tlNumber;
            }
          }
        }
      });
    }
    
    const timelinePrefix = `TL${highestTLNumber + 1} - `;
    const fullTimelineName = timelinePrefix + newTimelineName;
    
    // Set default wedding date to 6 months from now if not provided
    const today = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);
    const defaultWeddingDate = sixMonthsFromNow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    createTimelineMutation.mutate({
      userId: user.id,
      name: fullTimelineName,
      weddingDate: defaultWeddingDate,
      startHour: 6,
      timeFormat: "24h"
    });
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: "My Wedding Timeline",
        text: "Check out my wedding day timeline planning!",
        url: shareUrl,
      }).catch((error) => {
        console.log("Error sharing:", error);
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Link Copied!",
          description: "Share link has been copied to clipboard.",
        });
      },
      (err) => {
        console.error("Failed to copy:", err);
        toast({
          title: "Failed to copy",
          description: "Could not copy the link to clipboard.",
          variant: "destructive",
        });
      }
    );
  };

  const handleExportPdf = () => {
    if (timeline && events) {
      generatePdf(timeline, events);
    }
  };

  const isLoading = isTimelineLoading || isEventsLoading || isRestrictionsLoading;
  
  // For non-logged-in users, automatically load a default template
  useEffect(() => {
    const loadDefaultTemplateEvents = async () => {
      if (!user && !hasLoadedDefaultTemplate && timeline) {
        // Only load this once per session
        setHasLoadedDefaultTemplate(true);
        
        // Load church wedding template by default for non-logged in users
        try {
          const { data: templates } = await queryClient.fetchQuery({ 
            queryKey: ['/api/timeline-templates'] 
          });
          
          if (templates && templates.length > 0) {
            // Find Church Wedding template or use the first one
            const defaultTemplate = templates.find((t: any) => 
              t.name.toLowerCase().includes("church")
            ) || templates[0];
            
            // Fetch template events using the public endpoint
            const { data: templateEvents } = await queryClient.fetchQuery({ 
              queryKey: [`/api/template-events/${defaultTemplate.id}`] 
            });
            
            if (templateEvents && templateEvents.length > 0) {
              // Convert template events to timeline events - this will show in the UI
              // but won't be saved since the user isn't logged in
              const newEvents = templateEvents.map((event: any) => ({
                ...event,
                id: event.id + 1000, // Ensure unique IDs
                userId: null,
                timelineId: timeline.id
              }));
              
              // Update the events cache to display these events
              queryClient.setQueryData([`/api/timeline-events/${selectedTimelineId}`], newEvents);
              
              toast({
                title: "Example Timeline Loaded",
                description: "This is a sample template. Login to create and save your own timelines.",
              });
            }
          }
        } catch (error) {
          console.error("Error loading default template:", error);
        }
      }
    };
    
    loadDefaultTemplateEvents();
  }, [user, hasLoadedDefaultTemplate, timeline, selectedTimelineId, toast]);
  
  // Provide save and share handlers to the parent component
  useEffect(() => {
    if (provideSaveHandler) {
      provideSaveHandler(handleSave);
    }
    
    if (provideShareHandler) {
      provideShareHandler(handleShare);
    }
  }, [provideSaveHandler, provideShareHandler, handleSave, handleShare]);
  
  // Handler for adding new events from Things to Consider
  const handleAddEvent = (eventData: any) => {
    addEventMutation.mutate({
      ...eventData,
      timelineId: selectedTimelineId,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Main Content */}
      <div className="flex-grow container mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row mt-8">
          {/* Left Column: Timeline and Things to Consider */}
          <div className="flex-grow lg:pr-6">
            {/* Timeline View Container */}
            <div className="p-4 md:p-6 lg:p-8 overflow-x-auto bg-white rounded-lg shadow-sm">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <p>Loading timeline...</p>
                </div>
              ) : (
                <Timeline 
                  timeline={timeline} 
                  events={events} 
                  venueRestrictions={restrictions}
                  selectedEventId={selectedEventId}
                  setSelectedEventId={setSelectedEventId}
                />
              )}
            </div>
            
            {/* Things to Consider - Now below timeline */}
            {user && (
              <div className="mt-8">
                <ThingsToConsider
                  timelineId={selectedTimelineId}
                  onAddEvent={handleAddEvent}
                />
              </div>
            )}
          </div>
          
          {/* Right Column: Control Panel */}
          <div className="lg:w-96 bg-white shadow-md lg:shadow-none lg:border-l border-gray-200 p-4 md:p-6 lg:h-screen lg:overflow-y-auto mt-6 lg:mt-0">
            <ControlPanel 
              timeline={timeline}
              events={events}
              venueRestrictions={restrictions}
              selectedEventId={selectedEventId}
              setSelectedEventId={setSelectedEventId}
              handleExportPdf={handleExportPdf}
              userTimelines={userTimelines}
              selectedTimelineId={selectedTimelineId}
              setSelectedTimelineId={handleTimelineChange}
              handleCreateTimeline={handleCreateTimeline}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Controls Toggle Button (visible only on mobile) */}
      <button id="mobile-controls-toggle" className="lg:hidden fixed bottom-4 right-4 bg-primary text-white rounded-full p-4 shadow-lg z-20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Auth Prompt Dialog */}
      <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in Required</DialogTitle>
            <DialogDescription>
              You need to sign in or create an account to save your timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center my-4">
            <Button 
              variant="default" 
              size="lg" 
              className="w-full"
              onClick={() => {
                setShowAuthPrompt(false);
                setLocation('/auth');
              }}
            >
              Go to Login / Register
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Timeline Dialog */}
      <Dialog open={showNewTimelineDialog} onOpenChange={setShowNewTimelineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Timeline</DialogTitle>
            <DialogDescription>
              Create a new wedding timeline to organize your special day.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="timeline-name">Timeline Name</Label>
              <div className="flex items-center">
                <div className="bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 border-input text-muted-foreground">
                  {(() => {
                    // Calculate the next TL number based on the highest existing TL number
                    let highestTLNumber = 0;
                    if (userTimelines && Array.isArray(userTimelines) && userTimelines.length > 0) {
                      userTimelines.forEach((timeline: any) => {
                        if (timeline.name) {
                          const match = timeline.name.match(/^TL(\d+) -/);
                          if (match && match[1]) {
                            const tlNumber = parseInt(match[1]);
                            if (tlNumber > highestTLNumber) {
                              highestTLNumber = tlNumber;
                            }
                          }
                        }
                      });
                    }
                    return `TL${highestTLNumber + 1} - `;
                  })()}
                </div>
                <Input
                  id="timeline-name"
                  className="rounded-l-none"
                  placeholder="Enter a name for your timeline"
                  value={newTimelineName}
                  onChange={(e) => setNewTimelineName(e.target.value)}
                />
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTimelineDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitNewTimeline} 
              disabled={!newTimelineName || createTimelineMutation.isPending}
            >
              {createTimelineMutation.isPending ? 'Creating...' : 'Create Timeline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Changes Dialog */}
      <Dialog open={showSaveChangesDialog} onOpenChange={setShowSaveChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Changes?</DialogTitle>
            <DialogDescription>
              Would you like to save changes to your current timeline before switching?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                // Discard changes
                setShowSaveChangesDialog(false);
                if (pendingTimelineId !== null) {
                  const timelineToSwitch = pendingTimelineId;
                  setPendingTimelineId(null);
                  setSelectedTimelineId(timelineToSwitch);
                }
              }}
            >
              Don't Save
            </Button>
            <Button
              onClick={() => {
                // Save changes
                handleSave();
                setShowSaveChangesDialog(false);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}

export default Home;
