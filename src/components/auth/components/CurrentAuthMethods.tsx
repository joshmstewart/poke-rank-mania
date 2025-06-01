
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Unlink, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChangePasswordForm } from './ChangePasswordForm';

interface CurrentAuthMethodsProps {
  user: User | null;
  onUnlinkIdentity: (provider: string) => Promise<void>;
  isLoading: boolean;
}

export const CurrentAuthMethods: React.FC<CurrentAuthMethodsProps> = ({
  user,
  onUnlinkIdentity,
  isLoading
}) => {
  const [showChangePassword, setShowChangePassword] = useState(false);

  const hasEmail = !!user?.email;
  const hasPhone = !!user?.phone;
  const hasGoogle = user?.app_metadata?.providers?.includes('google');

  return (
    <div>
      <h4 className="text-sm font-medium mb-3">Currently Linked</h4>
      <div className="space-y-2">
        {hasEmail && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-600" />
                <span className="text-sm">Email: {user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangePassword(!showChangePassword)}
              >
                <Key className="h-3 w-3 mr-1" />
                Change Password
                {showChangePassword ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
            </div>
            
            <Collapsible open={showChangePassword} onOpenChange={setShowChangePassword}>
              <CollapsibleContent className="mt-3">
                <ChangePasswordForm onClose={() => setShowChangePassword(false)} />
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
        
        {hasPhone && (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-600" />
              <span className="text-sm">Phone: {user?.phone}</span>
            </div>
          </div>
        )}
        
        {hasGoogle && (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm">Google Account</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUnlinkIdentity('google')}
              disabled={isLoading}
            >
              <Unlink className="h-3 w-3 mr-1" />
              Unlink
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
