
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
  // 1. Log received props at the very top
  console.log(
    "🔵 [PROFILE_ACTIONS_PROPS] Received Props: ",
    {
      saving_prop: saving,
      hasChanges_prop: hasChanges,
      user_prop_exists: !!user,
      onSave_prop_type: typeof onSave
    }
  );

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

  // 3. Clearly defined handler for Save Changes button
  const handleSaveChangesButtonClick = (e: React.MouseEvent) => {
    console.log("🟢🟢🟢 [PROFILE_ACTIONS_CLICK] 'Save Changes' Button onClick Handler EXECUTED! 🟢🟢🟢");
    
    console.log('🔘 [PROFILE_ACTIONS] ===== SAVE BUTTON CLICKED =====');
    console.log('🔘 [PROFILE_ACTIONS] Click event:', e);
    console.log('🔘 [PROFILE_ACTIONS] onSave function exists:', !!onSave);
    console.log('🔘 [PROFILE_ACTIONS] saving state:', saving);
    console.log('🔘 [PROFILE_ACTIONS] hasChanges state:', hasChanges);
    console.log('🔘 [PROFILE_ACTIONS] user exists:', !!user);
    console.log('🔘 [PROFILE_ACTIONS] Call stack at click:', new Error().stack);
    
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
    
    console.log('🔘 [PROFILE_ACTIONS] ✅ About to call onSave...');
    try {
      const result = onSave();
      console.log('🔘 [PROFILE_ACTIONS] onSave called, result:', result);
    } catch (error) {
      console.error('🔘 [PROFILE_ACTIONS] Error calling onSave:', error);
    }
  };

  // Test button that bypasses everything
  const directTest = () => {
    console.log('🟢 [PROFILE_ACTIONS] DIRECT TEST CLICKED! 🟢');
    alert('Direct save test clicked! This proves the button can receive clicks.');
    
    // Try calling onSave directly
    if (onSave) {
      console.log('🟢 [PROFILE_ACTIONS] Calling onSave from direct test...');
      onSave();
    }
  };

  // 2. Calculate disabled state and log before return
  const isButtonDisabled = saving || !hasChanges || !user;
  console.log(
    "🔵 [PROFILE_ACTIONS_DISABLED_CHECK] Button Disabled Status:",
    {
      isButtonDisabled_final: isButtonDisabled,
      condition_saving: saving,
      condition_not_hasChanges: !hasChanges, // Crucial for our hypothesis
      condition_not_user: !user
    }
  );

  return (
    <div className="flex flex-col gap-2 pt-4">
      {/* DEBUG BUTTON */}
      <div className="bg-yellow-100 p-2 border border-yellow-300 rounded">
        <p className="text-xs text-yellow-700 mb-2">Debug: Actions test button</p>
        <button 
          onClick={directTest}
          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
        >
          🟢 ACTIONS TEST
        </button>
      </div>
      
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
