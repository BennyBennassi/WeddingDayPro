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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parse } from "date-fns";

interface HomeProps {
  provideSaveHandler?: (handler: () => void) => void;
  provideShareHandler?: (handler: () => void) => void;
}

function Home({ provideSaveHandler, provideShareHandler }: HomeProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTimelineId, setSelectedTimelineId] = useState<number | null>(null); // Start with no timeline selected
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showNewTimelineDialog, setShowNewTimelineDialog] = useState(false);
  const [newTimelineName, setNewTimelineName] = useState("");
  const [newTimelineDate, setNewTimelineDate] = useState("");
  const [hasLoadedDefaultTemplate, setHasLoadedDefaultTemplate] = useState(false);
  
  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSnapPoint, setActiveSnapPoint] = useState<string | number>(0.5);
  
  // State for timeline switching
  const [showSaveChangesDialog, setShowSaveChangesDialog] = useState(false);
  const [pendingTimelineId, setPendingTimelineId] = useState<number | null>(null);
  // Track if timeline has been modified since last save
  const [timelineModified, setTimelineModified] = useState(false);
  const { generatePdf } = usePdfExport();
  
  // Fetch user's timelines
  const { data: userTimelines = [], isLoading: isUserTimelinesLoading } = useQuery<any[]>({
    queryKey: ['/api/wedding-timelines'],
    enabled: !!user, // Only run this query if user is logged in
  });

  // Fetch the timeline data
  const { data: timeline = null, isLoading: isTimelineLoading } = useQuery<any>({
    queryKey: [`/api/wedding-timelines/single/${selectedTimelineId}`],
    enabled: !!selectedTimelineId, // Only run when a timeline is selected
  });

  // Fetch the timeline events
  const { data: events = [], isLoading: isEventsLoading } = useQuery<any[]>({
    queryKey: [`/api/timeline-events/${selectedTimelineId}`],
    enabled: !!selectedTimelineId, // Only run when a timeline is selected
  });

  // Fetch venue restrictions
  const { data: restrictions = null, isLoading: isRestrictionsLoading } = useQuery<any>({
    queryKey: [`/api/venue-restrictions/${selectedTimelineId}`],
    enabled: !!selectedTimelineId, // Only run when a timeline is selected
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
      // Mark timeline as modified
      setTimelineModified(true);
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
      // Invalidate all timelines list
      queryClient.invalidateQueries({ queryKey: ['/api/wedding-timelines'] });
      
      // Set empty events data for the new timeline to ensure it starts fresh
      queryClient.setQueryData([`/api/timeline-events/${newTimeline.id}`], []);
      
      // Set empty venue restrictions data for the new timeline
      queryClient.setQueryData([`/api/venue-restrictions/${newTimeline.id}`], null);
      
      // Reset timelineModified flag since this is a brand new timeline
      setTimelineModified(false);
      
      // Close dialogs and reset form values
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
    
    // Reset the modified flag since we're saving
    setTimelineModified(false);
    
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
    
    if (timelineModified) {
      // Only show save changes dialog if there are unsaved changes
      setPendingTimelineId(newTimelineId);
      setShowSaveChangesDialog(true);
    } else {
      // If no changes, switch timelines directly
      setSelectedTimelineId(newTimelineId);
    }
  };
  
  // Handle creating a new timeline
  const handleCreateTimeline = () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    
    // If this is the user's first timeline, name it "My Wedding"
    if (!Array.isArray(userTimelines) || userTimelines.length === 0) {
      setNewTimelineName("My Wedding");
    } else {
      // Generate a timeline name with TL prefix and number for subsequent timelines
      let highestTLNumber = 0;
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
      const timelinePrefix = `TL${highestTLNumber + 1} - `;
      setNewTimelineName(`${timelinePrefix}New Timeline`);
    }
    
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
    if (timeline && Array.isArray(events)) {
      generatePdf(timeline, events);
    }
  };

  const isLoading = isTimelineLoading || isEventsLoading || isRestrictionsLoading;
  
  // Load a default template for users with no timelines or non-logged in users
  useEffect(() => {
    // Remove automatic template loading
    // Only load templates when explicitly requested through TemplateSelector
  }, [user, userTimelines, timeline, hasLoadedDefaultTemplate]);
  
  // Set the correct timeline ID when user data or timelines change
  // Save selected timeline ID to localStorage when it changes
  useEffect(() => {
    if (user && selectedTimelineId) {
      localStorage.setItem(`lastUsedTimeline_${user.id}`, selectedTimelineId.toString());
    }
  }, [user, selectedTimelineId]);

  useEffect(() => {
    // For logged-in users, check for previously used timeline
    if (user && userTimelines && Array.isArray(userTimelines) && userTimelines.length > 0 && !selectedTimelineId) {
      // Try to get last used timeline from localStorage
      const lastUsedTimelineId = localStorage.getItem(`lastUsedTimeline_${user.id}`);
      
      if (lastUsedTimelineId) {
        // Verify the timeline still exists in the user's list
        const timelineExists = userTimelines.some(
          (timeline: any) => timeline.id.toString() === lastUsedTimelineId
        );
        
        if (timelineExists) {
          setSelectedTimelineId(parseInt(lastUsedTimelineId));
          return;
        }
      }
      
      // If no last used timeline found, use the first timeline
      setSelectedTimelineId(userTimelines[0].id);
    } else if (!user && !selectedTimelineId) {
      // For non-logged in users, set to a default demo timeline (ID 1)
      setSelectedTimelineId(1);
    }
  }, [user, userTimelines, selectedTimelineId]);

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

  // Add these variables at the top of the component
  const weddingCouple = timeline?.weddingCouple || '';
  const formattedDate = timeline?.weddingDate ? 
    format(parse(timeline.weddingDate, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM do, yyyy') : 
    'Your Wedding Day';

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* New Top Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              {weddingCouple ? (
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{weddingCouple}</h1>
              ) : (
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary">Wedding Day Timeline</h1>
              )}
              <h2 className="text-base sm:text-lg md:text-xl font-medium text-gray-700 mt-1">{formattedDate}</h2>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 mt-4 md:mt-0">
              {/* Timeline Selection Controls */}
              <div className="flex items-center gap-2">
                <Select
                  value={selectedTimelineId?.toString()}
                  onValueChange={(value) => handleTimelineChange(parseInt(value))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a Timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {userTimelines && Array.isArray(userTimelines) && userTimelines.length > 0 ? (
                      userTimelines.map((timeline: any) => (
                        <SelectItem key={timeline.id} value={timeline.id.toString()}>
                          {timeline.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="create" onClick={handleCreateTimeline}>
                        Create Your First Timeline
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleCreateTimeline}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Timeline
                </Button>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Timeline
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-grow container mx-auto px-2 sm:px-4 pb-8">
        <div className="flex flex-col lg:flex-row mt-4 lg:mt-8">
          {/* Left Column: Timeline and Things to Consider */}
          <div className="flex-grow lg:pr-6">
            {/* Timeline View Container */}
            <div className="p-2 sm:p-4 md:p-6 lg:p-8 overflow-x-auto bg-white rounded-lg shadow-sm">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <p>Loading timeline...</p>
                </div>
              ) : (
                <Timeline 
                  timeline={timeline} 
                  events={events as any[]} 
                  venueRestrictions={restrictions}
                  selectedEventId={selectedEventId}
                  setSelectedEventId={setSelectedEventId}
                  setTimelineModified={setTimelineModified}
                />
              )}
            </div>
            
            {/* Things to Consider - Now below timeline */}
            {user && selectedTimelineId && (
              <div className="mt-6 lg:mt-8">
                <ThingsToConsider
                  timelineId={selectedTimelineId}
                  onAddEvent={handleAddEvent}
                />
              </div>
            )}
          </div>
          
          {/* Right Column: Control Panel - Always visible on desktop, drawer on mobile */}
          <div className="lg:w-96 bg-white shadow-md lg:shadow-none lg:border-l border-gray-200 p-4 md:p-6 lg:h-screen lg:overflow-y-auto mt-6 lg:mt-0 
                         hidden lg:block" 
               id="desktop-control-panel">

            <ControlPanel 
              timeline={timeline}
              events={events as any[]}
              venueRestrictions={restrictions}
              selectedEventId={selectedEventId}
              setSelectedEventId={setSelectedEventId}
              handleExportPdf={handleExportPdf}
              userTimelines={userTimelines as any[]}
              selectedTimelineId={selectedTimelineId}
              setSelectedTimelineId={handleTimelineChange}
              handleCreateTimeline={handleCreateTimeline}
              setTimelineModified={setTimelineModified}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Controls Toggle Button */}
      <button 
        id="mobile-controls-toggle" 
        className="lg:hidden fixed bottom-4 right-4 bg-primary text-white rounded-full p-4 shadow-lg z-50"
        onClick={() => {
          // Show mobile panel
          const mobilePanel = document.getElementById('mobile-control-panel');
          if (mobilePanel) {
            mobilePanel.classList.remove('hidden');
            mobilePanel.classList.add('fixed', 'inset-0', 'z-50', 'bg-white', 'overflow-y-auto');
          }
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      
      {/* Mobile Control Panel - Hidden by default */}
      <div id="mobile-control-panel" className="hidden">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Timeline Controls</h2>
            <button 
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={() => {
                const mobilePanel = document.getElementById('mobile-control-panel');
                if (mobilePanel) {
                  mobilePanel.classList.add('hidden');
                  mobilePanel.classList.remove('fixed', 'inset-0', 'z-50', 'bg-white', 'overflow-y-auto');
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <ControlPanel 
            timeline={timeline}
            events={events as any[]}
            venueRestrictions={restrictions}
            selectedEventId={selectedEventId}
            setSelectedEventId={setSelectedEventId}
            handleExportPdf={handleExportPdf}
            userTimelines={userTimelines as any[]}
            selectedTimelineId={selectedTimelineId}
            setSelectedTimelineId={handleTimelineChange}
            handleCreateTimeline={handleCreateTimeline}
            setTimelineModified={setTimelineModified}
            isMobile={true}
          />
        </div>
      </div>

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
