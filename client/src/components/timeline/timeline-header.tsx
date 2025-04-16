import React from 'react';
import { format, parse } from 'date-fns';

interface TimelineHeaderProps {
  weddingDate?: string;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ weddingDate }) => {
  // Format the wedding date nicely if it exists
  const formattedDate = weddingDate ? 
    format(parse(weddingDate, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM do, yyyy') : 
    'Your Wedding Day';

  return (
    <div className="mb-8">
      <h2 className="text-xl font-medium text-gray-700 mb-2">Timeline for {formattedDate}</h2>
      <p className="text-gray-500">Drag and drop activities to plan your perfect day</p>
    </div>
  );
};

export default TimelineHeader;
