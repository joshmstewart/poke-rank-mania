
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
  console.log('🔘 [PROFILE_ACTIONS] ===== COMPONENT RENDER =====');
  console.log('🔘 [PROFILE_ACTIONS] Render state:', {
    saving,
    onSaveExists: !!onSave,
    onSaveType: typeof onSave,
    onCancelExists: !!onCancel,
    timestamp: new Date().toISOString()
  });

  const handleCancelClick = (e: React.MouseEvent) => {
    console.log('🔘 [PROFILE_ACTIONS] Cancel button clicked');
    e.preventDefault();
    e.stopPropagation();
    onCancel();
  };

  // Simplified save handler - direct call to onSave
  const handleSaveClick = () => {
    console.log('🔘 [PROFILE_ACTIONS] ===== SAVE BUTTON CLICKED (SIMPLIFIED) =====');
    console.log('🔘 [PROFILE_ACTIONS] onSave function exists:', !!onSave);
    console.log('🔘 [PROFILE_ACTIONS] saving state:', saving);
    
    if (saving) {
      console.log('🔘 [PROFILE_ACTIONS] ❌ Blocked - already saving');
      return;
    }
    
    if (!onSave) {
      console.error('🔘 [PROFILE_ACTIONS] ❌ No onSave function!');
      return;
    }
    
    console.log('🔘 [PROFILE_ACTIONS] ✅ Calling onSave...');
    onSave();
  };

  return (
    <div className="flex flex-col gap-2 pt-4">
      {/* NORMAL BUTTONS */}
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={handleCancelClick}
          type="button"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSaveClick} 
          disabled={saving}
          type="button"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
