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
  
  // Determine which hours should be displayed on the timeline based on events
  const determineVisibleHours = (): number[] => {
    if (!events || events.length === 0) {
      // Default hours if no events
      const startHour = timeline?.startHour || 6;
      return [startHour, (startHour + 6) % 24, (startHour + 12) % 24, (startHour + 18) % 24];
    }
    
    const startHour = timeline?.startHour || 6;
    const visibleHoursSet = new Set<number>();
    
    // Always show the start hour
    visibleHoursSet.add(startHour);
    
    // Add hours from event start and end times
    events.forEach(event => {
      const eventStartHour = parseInt(event.startTime.split(':')[0]);
      const eventEndHour = parseInt(event.endTime.split(':')[0]);
      
      visibleHoursSet.add(eventStartHour);
      visibleHoursSet.add(eventEndHour);
      
      // Add the hour before and after if different
      visibleHoursSet.add((eventStartHour - 1 + 24) % 24);
      visibleHoursSet.add((eventEndHour + 1) % 24);
    });
    
    // Convert set to array and sort
    return Array.from(visibleHoursSet).sort((a, b) => {
      // Sort with respect to the timeline start hour
      const adjustedA = (a - startHour + 24) % 24;
      const adjustedB = (b - startHour + 24) % 24;
      return adjustedA - adjustedB;
    });
  };

  // Sort time blocks by position
  const sortedEvents = [...(events || [])].sort((a, b) => a.position - b.position);
  
  return (
    <div>
      <TimelineHeader weddingDate={timeline?.weddingDate} />
      
      <div className="timeline-container min-w-max">
        
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
