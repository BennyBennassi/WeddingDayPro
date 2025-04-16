import { calculateTimePosition } from '@/lib/helpers';

interface RestrictionLineProps {
  time: string;
  startHour: number;
  label: string;
  type: 'start' | 'end';
}

const RestrictionLine = ({ 
  time, 
  startHour, 
  label,
  type
}: RestrictionLineProps) => {
  const position = calculateTimePosition(time, startHour);
  
  return (
    <div 
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 opacity-70 z-10"
      style={{ left: position }}
    >
      <div 
        className={`absolute top-0 transform -translate-y-full ${
          type === 'start' ? 'text-right -translate-x-full' : 'text-left translate-x-2'
        } text-xs font-medium text-red-600 max-w-[100px] px-1 py-0.5 bg-white bg-opacity-80 rounded`}
      >
        {label}
      </div>
      
      {/* Arrow indicating direction */}
      <div className="absolute top-1/2 transform -translate-y-1/2">
        {type === 'start' ? (
          <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">&gt;</span>
          </div>
        ) : (
          <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">&lt;</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestrictionLine;