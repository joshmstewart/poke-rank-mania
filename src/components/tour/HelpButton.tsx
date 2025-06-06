
import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useTour } from './TourProvider';

export const HelpButton: React.FC = () => {
  const { startTour } = useTour();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startTour}
      className="flex items-center gap-2"
    >
      <HelpCircle className="w-4 h-4" />
      Help
    </Button>
  );
};
