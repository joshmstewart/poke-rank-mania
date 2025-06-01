
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';

interface ProfileModalActionsProps {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}

export const ProfileModalActions: React.FC<ProfileModalActionsProps> = ({
  onCancel,
  onSave,
  saving
}) => {
  console.log('🔘 [PROFILE_ACTIONS] Render - Saving:', saving, 'onSave type:', typeof onSave);

  const handleSaveClick = () => {
    console.log('🔘 [PROFILE_ACTIONS] Save button clicked! Calling onSave...');
    onSave();
  };

  const handleCancelClick = () => {
    console.log('🔘 [PROFILE_ACTIONS] Cancel button clicked!');
    onCancel();
  };

  return (
    <div className="flex justify-end gap-2 pt-4">
      <Button variant="outline" onClick={handleCancelClick}>
        Cancel
      </Button>
      <Button onClick={handleSaveClick} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Save className="mr-2 h-4 w-4" />
        Save Changes
      </Button>
    </div>
  );
};
