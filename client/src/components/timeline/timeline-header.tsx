import { format, parse } from 'date-fns';
import { AlertTriangle, Clock } from 'lucide-react';
import { calculateTimePosition } from '@/lib/helpers';

interface TimelineHeaderProps {
  weddingDate?: string;
  weddingCouple?: string;
  startHour?: number;
  venueRestrictions?: {
    musicEndTime?: string;
    ceremonyStartTime?: string;
    dinnerStartTime?: string;
    customRestrictionTime?: string;
    customRestrictionName?: string;
    showRestrictionLines?: boolean;
  };
  showRestrictionLines?: boolean;
  eventCount?: number;
}

const TimelineHeader = ({ 
  weddingDate, 
  weddingCouple,
  startHour = 6,
  venueRestrictions,
  showRestrictionLines = false,
  eventCount = 0
}: TimelineHeaderProps) => {
  // Format the wedding date nicely if it exists
  const formattedDate = weddingDate ? 
    format(parse(weddingDate, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM do, yyyy') : 
    'Your Wedding Day';

  // Determine the hour marks to display (in 24-hour format)
  const generateHourMarks = () => {
    const marks = [];
    for (let i = 0; i < 24; i++) {
      const hour = (startHour + i) % 24;
      const hourLabel = hour === 0 ? '00' : `${hour}`;
      
      marks.push(
        <div 
          key={hour}
          className="absolute text-xs font-medium text-gray-500"
          style={{ left: `${(i / 24) * 100}%` }}
        >
          {hourLabel}
        </div>
      );
    }
    return marks;
  };

  // Generate restriction markers for the header
  const generateRestrictionMarkers = () => {
    if (!venueRestrictions) return null;
    
    // Calculate line height based on event count
    // Fixed minimum height for empty timelines and additional height per event
    const lineHeight = eventCount === 0 
      ? '60px'  // Minimum height for empty timeline
      : `${Math.max(80, eventCount * 60)}px`;  // Height scales with events (minimum 80px)
      
    const markers = [];
    
    if (venueRestrictions.musicEndTime) {
      const position = calculateTimePosition(venueRestrictions.musicEndTime, startHour);
      markers.push(
        <div 
          key="music-end"
          className="absolute flex items-center z-10"
          style={{ left: position }}
        >
          <div className="group">
            <div className="w-4 h-4 bg-red-500 rounded-full cursor-pointer flex items-center justify-center transform hover:scale-110 transition-transform">
              <AlertTriangle className="h-2 w-2 text-white" />
            </div>
            <div className="invisible group-hover:visible absolute top-full mt-1 px-2 py-1 bg-red-100 border border-red-200 rounded-md shadow-sm flex items-center whitespace-nowrap transform -translate-x-1/2 left-1/2 z-20">
              <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-xs font-medium text-red-600">Music End: {venueRestrictions.musicEndTime}</span>
            </div>
          </div>
          
          {/* Vertical line extending down (only shown when restriction lines are enabled) */}
          {showRestrictionLines && (
            <div 
              className="absolute top-full w-0.5 bg-red-400 opacity-50 dashed-line pointer-events-none"
              style={{ height: lineHeight }}
            ></div>
          )}
        </div>
      );
    }
    
    if (venueRestrictions.ceremonyStartTime) {
      const position = calculateTimePosition(venueRestrictions.ceremonyStartTime, startHour);
      markers.push(
        <div 
          key="ceremony-start"
          className="absolute flex items-center z-10"
          style={{ left: position }}
        >
          <div className="group">
            <div className="w-4 h-4 bg-purple-500 rounded-full cursor-pointer flex items-center justify-center transform hover:scale-110 transition-transform">
              <AlertTriangle className="h-2 w-2 text-white" />
            </div>
            <div className="invisible group-hover:visible absolute top-full mt-1 px-2 py-1 bg-purple-100 border border-purple-200 rounded-md shadow-sm flex items-center whitespace-nowrap transform -translate-x-1/2 left-1/2 z-20">
              <AlertTriangle className="h-3 w-3 text-purple-500 mr-1" />
              <span className="text-xs font-medium text-purple-600">Ceremony After: {venueRestrictions.ceremonyStartTime}</span>
            </div>
          </div>
          
          {/* Vertical line extending down (only shown when restriction lines are enabled) */}
          {showRestrictionLines && (
            <div 
              className="absolute top-full w-0.5 bg-purple-400 opacity-50 dashed-line pointer-events-none"
              style={{ height: lineHeight }}
            ></div>
          )}
        </div>
      );
    }
    
    if (venueRestrictions.dinnerStartTime) {
      const position = calculateTimePosition(venueRestrictions.dinnerStartTime, startHour);
      markers.push(
        <div 
          key="dinner-start"
          className="absolute flex items-center z-10"
          style={{ left: position }}
        >
          <div className="group">
            <div className="w-4 h-4 bg-amber-500 rounded-full cursor-pointer flex items-center justify-center transform hover:scale-110 transition-transform">
              <AlertTriangle className="h-2 w-2 text-white" />
            </div>
            <div className="invisible group-hover:visible absolute top-full mt-1 px-2 py-1 bg-amber-100 border border-amber-200 rounded-md shadow-sm flex items-center whitespace-nowrap transform -translate-x-1/2 left-1/2 z-20">
              <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
              <span className="text-xs font-medium text-amber-600">Dinner By: {venueRestrictions.dinnerStartTime}</span>
            </div>
          </div>
          
          {/* Vertical line extending down (only shown when restriction lines are enabled) */}
          {showRestrictionLines && (
            <div 
              className="absolute top-full w-0.5 bg-amber-400 opacity-50 dashed-line pointer-events-none"
              style={{ height: lineHeight }}
            ></div>
          )}
        </div>
      );
    }
    
    if (venueRestrictions.customRestrictionTime && venueRestrictions.customRestrictionName) {
      const position = calculateTimePosition(venueRestrictions.customRestrictionTime, startHour);
      markers.push(
        <div 
          key="custom-restriction"
          className="absolute flex items-center z-10"
          style={{ left: position }}
        >
          <div className="group">
            <div className="w-4 h-4 bg-blue-500 rounded-full cursor-pointer flex items-center justify-center transform hover:scale-110 transition-transform">
              <AlertTriangle className="h-2 w-2 text-white" />
            </div>
            <div className="invisible group-hover:visible absolute top-full mt-1 px-2 py-1 bg-blue-100 border border-blue-200 rounded-md shadow-sm flex items-center whitespace-nowrap transform -translate-x-1/2 left-1/2 z-20">
              <AlertTriangle className="h-3 w-3 text-blue-500 mr-1" />
              <span className="text-xs font-medium text-blue-600">{venueRestrictions.customRestrictionName}: {venueRestrictions.customRestrictionTime}</span>
            </div>
          </div>
          
          {/* Vertical line extending down (only shown when restriction lines are enabled) */}
          {showRestrictionLines && (
            <div 
              className="absolute top-full w-0.5 bg-blue-400 opacity-50 dashed-line pointer-events-none"
              style={{ height: lineHeight }}
            ></div>
          )}
        </div>
      );
    }
    
    return markers;
  };

  return (
    <div className="mb-4 sm:mb-6">
      {/* Time ruler with hour markings and restrictions */}
      <div className="pl-16 sm:pl-32 md:pl-48 relative">
        <div className={`relative ${showRestrictionLines ? 'h-10 sm:h-12' : 'h-6 sm:h-8'} bg-gray-50 border border-gray-200 mb-2 sm:mb-4 rounded-md shadow-sm`}>
          {/* Hour markers at the top */}
          <div className="absolute top-0 left-0 right-0 h-6 flex items-center border-b border-gray-200">
            {generateHourMarks()}
          </div>
          
          {/* Restriction markers in the bottom half of the header */}
          {showRestrictionLines && (
            <div className="absolute bottom-0 left-0 right-0 h-6 flex items-center border-t border-gray-200">
              <div className="absolute left-0 text-xs font-medium text-gray-700 -ml-16 sm:-ml-32 md:-ml-48 w-14 sm:w-28 md:w-44 pl-1 sm:pl-2 truncate">
                <span className="hidden sm:inline">Time Restrictions</span>
                <span className="sm:hidden">Limits</span>
              </div>
              {generateRestrictionMarkers()}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile-only reminder */}
      <p className="text-gray-500 text-xs mt-1 sm:hidden text-center">
        Tap blocks to select and edit
      </p>
    </div>
  );
};

export default TimelineHeader;
