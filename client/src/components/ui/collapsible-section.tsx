import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = false,
  children,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`mb-6 overflow-hidden border rounded-lg shadow-sm ${className}`}
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
        <h3 className="text-md font-medium text-gray-700">{title}</h3>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CollapsibleSection;