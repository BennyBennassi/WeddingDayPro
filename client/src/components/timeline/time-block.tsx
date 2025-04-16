import React, { useState, useRef, useEffect } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatTimeTo24h, formatTimeTo12h, addMinutes, minutesBetween } from '@/lib/helpers';

interface TimeBlockProps {
  event: any;
  index: number;
  left: string;
  width: string;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (eventId: number, startTime: string, endTime: string) => void;
  conflict: { message: string } | false;
  isResizing: boolean;
  setIsResizing: (isResizing: boolean) => void;
  timeFormat: string;
  startHour: number;
}

const TimeBlock: React.FC<TimeBlockProps> = ({
  event,
  index,
  left,
  width,
  isSelected,
  onSelect,
  onUpdate,
  conflict,
  isResizing,
  setIsResizing,
  timeFormat
}) => {
  const [blockLeft, setBlockLeft] = useState(left);
  const [blockWidth, setBlockWidth] = useState(width);
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState(0);
  const [originalLeft, setOriginalLeft] = useState(0);
  const [originalWidth, setOriginalWidth] = useState(0);
  const blockRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBlockLeft(left);
    setBlockWidth(width);
  }, [left, width]);

  const formatTime = (time: string) => {
    // First parse the time
    const [hour, minute] = time.split(':').map(Number);
    
    // Check if this time is likely on the next day (after midnight)
    // based on the timeline start hour
    const startHour = event.startHour || 6; // Default to 6am if not specified
    
    // If the hour is less than the start hour, it's likely on the next day
    const isNextDay = hour < startHour;
    const dayIndicator = isNextDay ? ' (+1)' : '';
    
    // Format according to user preference
    const formattedTime = timeFormat === '24h' ? 
      formatTimeTo24h(time) : 
      formatTimeTo12h(time);
    
    return formattedTime + dayIndicator;
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (blockRef.current) {
      setIsResizing(true);
      setStartPosition(e.clientX);
      setOriginalWidth(parseFloat(blockWidth));
      
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!blockRef.current) return;
    
    const parentWidth = blockRef.current.parentElement?.offsetWidth || 0;
    const deltaPixels = e.clientX - startPosition;
    const deltaPercent = (deltaPixels / parentWidth) * 100;
    
    // Ensure minimum width (15 min)
    const minWidth = 100 / 24 / 4; // 15 minutes in percentage
    let newWidth = Math.max(originalWidth + deltaPercent, minWidth);
    
    // Ensure it doesn't go beyond the timeline
    const currentLeft = parseFloat(blockLeft);
    if (currentLeft + newWidth > 100) {
      newWidth = 100 - currentLeft;
    }
    
    setBlockWidth(`${newWidth}%`);
    
    // Calculate new end time
    if (blockRef.current && blockRef.current.parentElement) {
      const startTime = event.startTime;
      const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
      
      // 24 hours = 1440 minutes = 100% width
      const parentWidth = blockRef.current.parentElement.offsetWidth;
      const minutesPerPixel = 1440 / parentWidth;
      const totalMinutes = newWidth * 14.4; // (1440 / 100) = 14.4 minutes per percent
      
      // Round to nearest 15 minutes
      const roundedMinutes = Math.round(totalMinutes / 15) * 15;
      const newEndMinutes = startMinutes + roundedMinutes;
      
      const hours = Math.floor(newEndMinutes / 60) % 24;
      const minutes = newEndMinutes % 60;
      
      const newEndTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  };

  const handleResizeEnd = (e: MouseEvent) => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    
    // Calculate new end time based on the width percentage
    if (blockRef.current && blockRef.current.parentElement) {
      const startTime = event.startTime;
      const startHour = parseInt(startTime.split(':')[0]);
      const startMinute = parseInt(startTime.split(':')[1]);
      
      // Calculate how many minutes this width represents
      // 24 hours (1440 minutes) = 100% width
      const newWidthMinutes = (parseFloat(blockWidth) / 100) * 1440;
      
      // Round to nearest 15 minutes
      const roundedMinutes = Math.round(newWidthMinutes / 15) * 15;
      
      // Calculate new end time
      const totalStartMinutes = startHour * 60 + startMinute;
      const totalEndMinutes = totalStartMinutes + roundedMinutes;
      
      const endHour = Math.floor(totalEndMinutes / 60) % 24;
      const endMinute = totalEndMinutes % 60;
      
      const newEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      // Update the event
      onUpdate(event.id, startTime, newEndTime);
    }
  };

  return (
    <Draggable draggableId={event.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={(el) => {
            provided.innerRef(el);
            blockRef.current = el;
          }}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`time-block absolute top-1 h-12 ${event.color} border ${event.color.replace('bg-', 'border-')} rounded-md shadow-sm flex items-center px-3 justify-between ${isSelected ? 'ring-2 ring-offset-2 ring-primary' : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
          style={{
            ...provided.draggableProps.style,
            left: blockLeft,
            width: blockWidth,
            cursor: isDragging ? 'grabbing' : 'grab',
            zIndex: isSelected || snapshot.isDragging ? 10 : 1
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isResizing) {
              onSelect();
            }
          }}
        >
          <span className="text-sm font-medium text-gray-800 truncate">{event.name}</span>
          <span className="text-xs text-gray-600 whitespace-nowrap ml-2">
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </span>
          
          {conflict && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="conflict-indicator" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{conflict.message}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <div 
            ref={resizeHandleRef}
            className={`absolute inset-y-0 right-0 w-2 ${event.color.replace('bg-', 'bg-').replace('100', '200')} rounded-r-md cursor-ew-resize`}
            onMouseDown={handleResizeStart}
          />
        </div>
      )}
    </Draggable>
  );
};

export default TimeBlock;
