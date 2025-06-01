
import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User } from 'lucide-react';

export const ProfileModalHeader: React.FC = () => {
  return (
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <User className="h-5 w-5" />
        Trainer Profile
      </DialogTitle>
    </DialogHeader>
  );
};
