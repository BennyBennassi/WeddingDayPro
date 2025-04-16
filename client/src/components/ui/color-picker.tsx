import React from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const colorOptions = [
  { value: 'bg-pink-100', borderColor: 'border-pink-300' },
  { value: 'bg-blue-100', borderColor: 'border-blue-300' },
  { value: 'bg-green-100', borderColor: 'border-green-300' },
  { value: 'bg-yellow-100', borderColor: 'border-yellow-300' },
  { value: 'bg-purple-100', borderColor: 'border-purple-300' },
  { value: 'bg-red-100', borderColor: 'border-red-300' },
  { value: 'bg-indigo-100', borderColor: 'border-indigo-300' },
  { value: 'bg-teal-100', borderColor: 'border-teal-300' },
  { value: 'bg-orange-100', borderColor: 'border-orange-300' },
  { value: 'bg-primary-light', borderColor: 'border-primary' },
  { value: 'bg-accent-light', borderColor: 'border-accent' },
  { value: 'bg-gray-200', borderColor: 'border-gray-300' }
];

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  return (
    <div className="flex space-x-2 flex-wrap gap-2">
      {colorOptions.map((color) => (
        <button
          key={color.value}
          type="button"
          className={cn(
            "w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm",
            color.value,
            value === color.value ? 'ring-2 ring-offset-2 ring-primary' : 'border-white'
          )}
          onClick={() => onChange(color.value)}
          aria-label={`Select color ${color.value}`}
        />
      ))}
    </div>
  );
};

export default ColorPicker;
