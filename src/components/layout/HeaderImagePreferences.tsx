
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings } from 'lucide-react';
import ImagePreferenceSelector from '@/components/settings/ImagePreferenceSelector';

const HeaderImagePreferences: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Image Style
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-6" align="center">
        <ImagePreferenceSelector onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

export default HeaderImagePreferences;
