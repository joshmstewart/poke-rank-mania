
import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useTour } from './TourProvider';

export const HelpButton: React.FC = () => {
  const { startTour } = useTour();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={startTour}
      className="p-2 h-auto hover:bg-gray-100"
      title="Help Tour"
    >
      <HelpCircle className="w-5 h-5 text-gray-600" />
    </Button>
  );
};
