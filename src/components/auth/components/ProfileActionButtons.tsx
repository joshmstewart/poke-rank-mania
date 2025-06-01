
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ProfileActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  username: string;
  displayName: string;
}

export const ProfileActionButtons: React.FC<ProfileActionButtonsProps> = ({
  onCancel,
  onSave,
  isSaving,
  username,
  displayName
}) => {
  return (
    <div className="flex gap-3 pt-4">
      <Button variant="outline" onClick={onCancel} className="flex-1" disabled={isSaving}>
        Cancel
      </Button>
      <Button 
        onClick={onSave} 
        disabled={isSaving || !username.trim() || !displayName.trim()}
        className="flex-1"
      >
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSaving ? 'Saving...' : 'Save Profile'}
      </Button>
    </div>
  );
};
