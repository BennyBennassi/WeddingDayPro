import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Timeline from "@/components/timeline/timeline";
import ControlPanel from "@/components/control-panel/control-panel";
import { Button } from "@/components/ui/button";
import { Save, Share } from "lucide-react";
import { usePdfExport } from "@/lib/exportPdf";

function Home() {
  const { toast } = useToast();
  const [selectedTimelineId] = useState(1); // Use the default timeline for now
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const { generatePdf } = usePdfExport();

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

  const handleSave = () => {
    toast({
      title: "Timeline Saved",
      description: "Your wedding timeline has been saved successfully.",
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
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-800">Wedding Timeline Planner</h1>
            <p className="text-sm text-gray-500">Plan your perfect day, hour by hour</p>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="default" 
              className="bg-primary hover:bg-primary-dark text-white" 
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            
            <Button 
              variant="secondary"
              className="bg-secondary hover:bg-secondary-dark text-white"
              onClick={handleShare}
            >
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow flex flex-col lg:flex-row">
        {/* Timeline View Container */}
        <div className="flex-grow p-4 md:p-6 lg:p-8 overflow-x-auto">
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
        
        {/* Control Panel */}
        <div className="lg:w-96 bg-white shadow-md lg:shadow-none lg:border-l border-gray-200 p-4 md:p-6 lg:h-screen lg:overflow-y-auto">
          <ControlPanel 
            timeline={timeline}
            events={events}
            venueRestrictions={restrictions}
            selectedEventId={selectedEventId}
            setSelectedEventId={setSelectedEventId}
            handleExportPdf={handleExportPdf}
          />
        </div>
      </main>
      
      {/* Mobile Controls Toggle Button (visible only on mobile) */}
      <button id="mobile-controls-toggle" className="lg:hidden fixed bottom-4 right-4 bg-primary text-white rounded-full p-4 shadow-lg z-20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  );
}

export default Home;
