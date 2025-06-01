
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';

interface ProfileModalActionsProps {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  hasChanges?: boolean;
  user?: any;
}

export const ProfileModalActions: React.FC<ProfileModalActionsProps> = ({
  onCancel,
  onSave,
  saving,
  hasChanges,
  user
}) => {
  console.log('🔘 [PROFILE_ACTIONS] ===== COMPONENT RENDER =====');
  console.log('🔘 [PROFILE_ACTIONS] Render state:', {
    saving,
    hasChanges,
    userExists: !!user,
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

  const handleSaveChangesButtonClick = (e: React.MouseEvent) => {
    console.log("🟢🟢🟢 [PROFILE_ACTIONS_CLICK] 'Save Changes' Button onClick Handler EXECUTED! 🟢🟢🟢");
    
    console.log('🔘 [PROFILE_ACTIONS] ===== SAVE BUTTON CLICKED =====');
    console.log('🔘 [PROFILE_ACTIONS] Click event:', e);
    console.log('🔘 [PROFILE_ACTIONS] onSave function exists:', !!onSave);
    console.log('🔘 [PROFILE_ACTIONS] saving state:', saving);
    console.log('🔘 [PROFILE_ACTIONS] hasChanges state:', hasChanges);
    console.log('🔘 [PROFILE_ACTIONS] user exists:', !!user);
    
    e.preventDefault();
    e.stopPropagation();
    
    if (saving) {
      console.log('🔘 [PROFILE_ACTIONS] ❌ Blocked - already saving');
      return;
    }
    
    if (!onSave) {
      console.error('🔘 [PROFILE_ACTIONS] ❌ No onSave function!');
      return;
    }
    
    if (!hasChanges) {
      console.log('🔘 [PROFILE_ACTIONS] ❌ No changes to save');
      return;
    }
    
    console.log('🔘 [PROFILE_ACTIONS] ✅ About to call onSave...');
    try {
      const result = onSave();
      console.log('🔘 [PROFILE_ACTIONS] onSave called, result:', result);
    } catch (error) {
      console.error('🔘 [PROFILE_ACTIONS] Error calling onSave:', error);
    }
  };

  const isButtonDisabled = saving || !hasChanges || !user;

  console.log('🔘 [PROFILE_ACTIONS] Button disabled state:', isButtonDisabled);
  console.log('🔘 [PROFILE_ACTIONS] Disabled reasons:', {
    saving,
    noChanges: !hasChanges,
    noUser: !user
  });

  return (
    <div className="flex flex-col gap-2 pt-4">
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={handleCancelClick}
          type="button"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSaveChangesButtonClick}
          disabled={isButtonDisabled}
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
