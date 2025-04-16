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
    <>
      {/* Full-length horizontal line */}
      <div 
        className="absolute top-1/2 transform -translate-y-1/2 h-0 left-0 right-0 border-t-2 border-dashed border-red-300 opacity-50 z-5 shadow"
        style={{ filter: 'drop-shadow(0 1px 1px rgba(255,0,0,0.1))' }}
      />
      
      {/* Vertical indicator line */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-red-500 opacity-70 z-10 shadow-md"
        style={{ 
          left: position,
          boxShadow: '0 0 5px rgba(255, 0, 0, 0.3)',
          background: 'linear-gradient(to right, rgba(244, 63, 94, 0.9), rgba(244, 63, 94, 0.7))'
        }}
      >
        <div 
          className={`absolute top-0 transform -translate-y-full ${
            type === 'start' ? 'text-right -translate-x-full' : 'text-left translate-x-2'
          } text-xs font-medium text-red-600 max-w-[100px] px-1 py-0.5 bg-white bg-opacity-80 rounded shadow-sm`}
        >
          {label}
        </div>
        
        {/* Arrow indicating direction */}
        <div className="absolute top-1/2 transform -translate-y-1/2">
          {type === 'start' ? (
            <>
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-md absolute -left-2">
                <span className="text-white text-[10px] font-bold">&gt;</span>
              </div>
              <div className="w-12 h-1 bg-gradient-to-r from-red-500 to-transparent absolute left-0"></div>
            </>
          ) : (
            <>
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-md absolute -left-2">
                <span className="text-white text-[10px] font-bold">&lt;</span>
              </div>
              <div className="w-12 h-1 bg-gradient-to-l from-red-500 to-transparent absolute left-0"></div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default RestrictionLine;