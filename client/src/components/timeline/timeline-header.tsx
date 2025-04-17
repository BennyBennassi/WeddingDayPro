import { format, parse } from 'date-fns';
import { AlertTriangle, Clock } from 'lucide-react';
import { calculateTimePosition } from '@/lib/helpers';

interface TimelineHeaderProps {
  weddingDate?: string;
  weddingOf?: string;
  startHour?: number;
  venueRestrictions?: any;
  showRestrictionLines?: boolean;
}

const TimelineHeader = ({ 
  weddingDate, 
  weddingOf,
  startHour = 6,
  venueRestrictions,
  showRestrictionLines = false
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
            <div className="absolute top-full w-0.5 h-screen bg-red-400 opacity-50 dashed-line pointer-events-none"></div>
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
            <div className="absolute top-full w-0.5 h-screen bg-purple-400 opacity-50 dashed-line pointer-events-none"></div>
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
            <div className="absolute top-full w-0.5 h-screen bg-amber-400 opacity-50 dashed-line pointer-events-none"></div>
          )}
        </div>
      );
    }
    
    return markers;
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
        <div>
          {weddingOf ? (
            <h1 className="text-2xl font-bold text-primary">Wedding of {weddingOf}</h1>
          ) : (
            <h1 className="text-2xl font-bold text-primary">Wedding Day Timeline</h1>
          )}
          <h2 className="text-xl font-medium text-gray-700 mt-1">{formattedDate}</h2>
          <p className="text-gray-500 text-sm mt-1">Drag blocks to reorganize your timeline</p>
        </div>
        <div className="flex items-center text-gray-500 text-sm mt-2 md:mt-0">
          <Clock className="h-4 w-4 mr-1" />
          <span>24-hour format</span>
        </div>
      </div>
      
      {/* Time ruler with hour markings and restrictions */}
      <div className="pl-48 relative">
        <div className={`relative ${showRestrictionLines ? 'h-12' : 'h-8'} bg-gray-50 border-t border-b border-gray-200 mb-4 rounded-md`}>
          {/* Hour markers at the top */}
          <div className="absolute top-0 left-0 right-0 h-6 flex items-center">
            {generateHourMarks()}
          </div>
          
          {/* Restriction markers in the bottom half of the header */}
          {showRestrictionLines && (
            <div className="absolute bottom-0 left-0 right-0 h-6 flex items-center border-t border-gray-200">
              <div className="absolute left-0 text-xs font-medium text-gray-700 -ml-48 w-44 pl-2">
                Venue Restrictions
              </div>
              {generateRestrictionMarkers()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineHeader;
