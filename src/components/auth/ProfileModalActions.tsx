
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

  const handleSaveClick = (e: React.MouseEvent) => {
    console.log('🔘 [PROFILE_ACTIONS] ===== SAVE BUTTON CLICKED =====');
    console.log('🔘 [PROFILE_ACTIONS] Click event:', e);
    console.log('🔘 [PROFILE_ACTIONS] Button disabled state:', saving);
    console.log('🔘 [PROFILE_ACTIONS] onSave function:', {
      exists: !!onSave,
      type: typeof onSave,
      string: onSave.toString().substring(0, 100)
    });
    
    e.preventDefault();
    e.stopPropagation();
    
    if (saving) {
      console.log('🔘 [PROFILE_ACTIONS] ❌ Button is disabled due to saving state');
      return;
    }
    
    if (!onSave) {
      console.error('🔘 [PROFILE_ACTIONS] ❌ No onSave function provided!');
      return;
    }
    
    console.log('🔘 [PROFILE_ACTIONS] ✅ Calling onSave function...');
    try {
      onSave();
      console.log('🔘 [PROFILE_ACTIONS] ✅ onSave called successfully');
    } catch (error) {
      console.error('🔘 [PROFILE_ACTIONS] ❌ Error calling onSave:', error);
    }
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    console.log('🔘 [PROFILE_ACTIONS] Cancel button clicked');
    e.preventDefault();
    e.stopPropagation();
    onCancel();
  };

  console.log('🔘 [PROFILE_ACTIONS] About to render buttons with state:', {
    saving,
    buttonDisabled: saving,
    showSpinner: saving
  });

  return (
    <div className="flex justify-end gap-2 pt-4">
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
        className={saving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      >
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Save className="mr-2 h-4 w-4" />
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
};
