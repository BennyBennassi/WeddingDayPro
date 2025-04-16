import React, { useState } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import TimeBlock from './time-block';
import TimelineHeader from './timeline-header';
import { formatTimeTo24h, parseTime, formatTime, calculateTimePosition, calculateTimeWidth } from '@/lib/helpers';
import { useToast } from '@/hooks/use-toast';

interface TimelineProps {
  timeline: any;
  events: any[];
  venueRestrictions: any;
  selectedEventId: number | null;
  setSelectedEventId: (id: number | null) => void;
}

const Timeline: React.FC<TimelineProps> = ({ 
  timeline, 
  events, 
  venueRestrictions,
  selectedEventId,
  setSelectedEventId
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const { toast } = useToast();

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    const eventId = parseInt(result.draggableId);
    const event = events.find(e => e.id === eventId);
    
    if (!event) return;
    
    // Calculate new position based on drop location
    try {
      await apiRequest(
        'PUT',
        `/api/timeline-events/${eventId}`,
        { position: destinationIndex + 1 }
      );
      
      // Invalidate the query to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/timeline-events/${timeline.id}`] });
    } catch (error) {
      console.error('Failed to update block of time position:', error);
      toast({
        title: 'Error',
        description: 'Failed to update block of time position.',
        variant: 'destructive',
      });
    }
  };

  const handleTimeBlockUpdate = async (
    eventId: number, 
    newStartTime: string, 
    newEndTime: string
  ) => {
    try {
      await apiRequest(
        'PUT',
        `/api/timeline-events/${eventId}`,
        { startTime: newStartTime, endTime: newEndTime }
      );
      
      // Invalidate the query to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/timeline-events/${timeline.id}`] });
    } catch (error) {
      console.error('Failed to update block of time:', error);
      toast({
        title: 'Error',
        description: 'Failed to update block of time.',
        variant: 'destructive',
      });
    }
  };

  const checkForTimeConflicts = (event: any) => {
    if (!venueRestrictions) return false;
    
    const { startTime, endTime, category } = event;
    
    // Check music end time restriction
    if (venueRestrictions.musicEndTime && 
        (category === 'entertainment' || event.name.toLowerCase().includes('band') || event.name.toLowerCase().includes('dj'))) {
      const restrictionTime = parseTime(venueRestrictions.musicEndTime);
      const eventEndTime = parseTime(endTime);
      
      if (eventEndTime > restrictionTime) {
        return {
          message: `Block of time ends after venue's music restriction time of ${venueRestrictions.musicEndTime}`
        };
      }
    }
    
    // Check ceremony start time restriction
    if (venueRestrictions.ceremonyStartTime && 
        (category === 'ceremony' || event.name.toLowerCase().includes('ceremony'))) {
      const restrictionTime = parseTime(venueRestrictions.ceremonyStartTime);
      const eventStartTime = parseTime(startTime);
      
      if (eventStartTime < restrictionTime) {
        return {
          message: `Ceremony starts before venue's allowed time of ${venueRestrictions.ceremonyStartTime}`
        };
      }
    }
    
    // Check dinner start time restriction
    if (venueRestrictions.dinnerStartTime && 
        (category === 'food' || event.name.toLowerCase().includes('dinner') || event.name.toLowerCase().includes('dining'))) {
      const restrictionTime = parseTime(venueRestrictions.dinnerStartTime);
      const eventStartTime = parseTime(startTime);
      
      if (eventStartTime > restrictionTime) {
        return {
          message: `Dinner starts after venue's required time of ${venueRestrictions.dinnerStartTime}`
        };
      }
    }
    
    return false;
  };

  // Sort time blocks by position
  const sortedEvents = [...(events || [])].sort((a, b) => a.position - b.position);
  
  return (
    <div>
      <TimelineHeader weddingDate={timeline?.weddingDate} />
      
      <div className="timeline-container min-w-max">
        <div className="timeline-header flex mb-2">
          {/* Time markers */}
          <div className="w-48 flex-shrink-0"></div>
          <div className="flex-grow grid grid-cols-24 gap-0">
            {Array.from({ length: 24 }, (_, i) => {
              // Use the timeline start hour, defaulting to 6 if not set
              const startHour = timeline?.startHour || 6;
              const hour = (i + startHour) % 24;
              
              // Add day indicator for hours that are on the next day
              const dayIndicator = (i + startHour) >= 24 ? ' (+1)' : '';
              
              // Format the hour based on the user's preferred time format
              const displayHour = timeline?.timeFormat === '12h' ? 
                (hour % 12 || 12) + (hour >= 12 ? 'pm' : 'am') : 
                hour.toString();
              
              return (
                <div key={i} className="text-xs text-gray-500 text-center col-span-1">
                  {displayHour}{dayIndicator}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <Droppable droppableId="timeline-grid" type="event">
              {(provided) => (
                <div 
                  className="timeline-grid"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {sortedEvents.map((event, index) => {
                    const startHour = timeline?.startHour || 6;
                    const left = calculateTimePosition(event.startTime, startHour);
                    const width = calculateTimeWidth(event.startTime, event.endTime);
                    const conflict = checkForTimeConflicts(event);
                    
                    return (
                      <div key={event.id} className="flex items-center mb-4">
                        <div className="w-48 flex-shrink-0 pr-4">
                          <h3 className="font-medium text-gray-700">{event.name}</h3>
                        </div>
                        <div className="relative flex-grow h-14 bg-gray-100 rounded-md">
                          <TimeBlock
                            event={event}
                            index={index}
                            left={left}
                            width={width}
                            isSelected={selectedEventId === event.id}
                            onSelect={() => setSelectedEventId(event.id)}
                            onUpdate={handleTimeBlockUpdate}
                            conflict={conflict}
                            isResizing={isResizing}
                            setIsResizing={setIsResizing}
                            timeFormat={timeline?.timeFormat || '24h'}
                            startHour={timeline?.startHour || 6}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
