import { format, parse } from 'date-fns';
import { AlertTriangle, Clock } from 'lucide-react';
import { calculateTimePosition } from '@/lib/helpers';

interface TimelineHeaderProps {
  weddingDate?: string;
  startHour?: number;
  venueRestrictions?: any;
  showRestrictionLines?: boolean;
}

const TimelineHeader = ({ 
  weddingDate, 
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

  // Generate restriction markers
  const generateRestrictionMarkers = () => {
    if (!venueRestrictions || !showRestrictionLines) return null;
    
    const markers = [];
    
    if (venueRestrictions.musicEndTime) {
      const position = calculateTimePosition(venueRestrictions.musicEndTime, startHour);
      markers.push(
        <div 
          key="music-end"
          className="absolute h-full flex flex-col items-center z-10"
          style={{ left: position }}
        >
          <div className="group relative">
            <div className="w-4 h-4 bg-red-500 rounded-full cursor-pointer flex items-center justify-center transform hover:scale-110 transition-transform">
              <AlertTriangle className="h-2 w-2 text-white" />
            </div>
            <div className="invisible group-hover:visible absolute bottom-full mb-2 px-2 py-1 bg-red-100 border border-red-200 rounded-md shadow-sm flex items-center whitespace-nowrap transform -translate-x-1/2 left-1/2">
              <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-xs font-medium text-red-600">Music End: {venueRestrictions.musicEndTime}</span>
            </div>
          </div>
          <div className="w-0.5 h-full bg-red-400 opacity-50 dashed-line"></div>
        </div>
      );
    }
    
    if (venueRestrictions.ceremonyStartTime) {
      const position = calculateTimePosition(venueRestrictions.ceremonyStartTime, startHour);
      markers.push(
        <div 
          key="ceremony-start"
          className="absolute h-full flex flex-col items-center z-10"
          style={{ left: position }}
        >
          <div className="group relative">
            <div className="w-4 h-4 bg-purple-500 rounded-full cursor-pointer flex items-center justify-center transform hover:scale-110 transition-transform">
              <AlertTriangle className="h-2 w-2 text-white" />
            </div>
            <div className="invisible group-hover:visible absolute bottom-full mb-2 px-2 py-1 bg-purple-100 border border-purple-200 rounded-md shadow-sm flex items-center whitespace-nowrap transform -translate-x-1/2 left-1/2">
              <AlertTriangle className="h-3 w-3 text-purple-500 mr-1" />
              <span className="text-xs font-medium text-purple-600">Ceremony After: {venueRestrictions.ceremonyStartTime}</span>
            </div>
          </div>
          <div className="w-0.5 h-full bg-purple-400 opacity-50 dashed-line"></div>
        </div>
      );
    }
    
    if (venueRestrictions.dinnerStartTime) {
      const position = calculateTimePosition(venueRestrictions.dinnerStartTime, startHour);
      markers.push(
        <div 
          key="dinner-start"
          className="absolute h-full flex flex-col items-center z-10"
          style={{ left: position }}
        >
          <div className="group relative">
            <div className="w-4 h-4 bg-amber-500 rounded-full cursor-pointer flex items-center justify-center transform hover:scale-110 transition-transform">
              <AlertTriangle className="h-2 w-2 text-white" />
            </div>
            <div className="invisible group-hover:visible absolute bottom-full mb-2 px-2 py-1 bg-amber-100 border border-amber-200 rounded-md shadow-sm flex items-center whitespace-nowrap transform -translate-x-1/2 left-1/2">
              <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
              <span className="text-xs font-medium text-amber-600">Dinner By: {venueRestrictions.dinnerStartTime}</span>
            </div>
          </div>
          <div className="w-0.5 h-full bg-amber-400 opacity-50 dashed-line"></div>
        </div>
      );
    }
    
    return markers;
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-xl font-medium text-gray-800">{formattedDate}</h2>
          <p className="text-gray-500 text-sm">Drag blocks to reorganize your timeline</p>
        </div>
        <div className="flex items-center text-gray-500 text-sm">
          <Clock className="h-4 w-4 mr-1" />
          <span>24-hour format</span>
        </div>
      </div>
      
      {/* Time ruler with hour markings */}
      <div className="pl-48 relative">
        <div className="relative h-8 bg-gray-50 border-t border-b border-gray-200 mb-4 rounded-md">
          {generateHourMarks()}
        </div>
        
        {/* Restriction markers - positioned relative to the timeline */}
        <div className="relative" style={{ height: 'calc(100% - 2rem)' }}>
          {generateRestrictionMarkers()}
        </div>
      </div>
    </div>
  );
};

export default TimelineHeader;
