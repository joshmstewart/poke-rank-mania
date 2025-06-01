
import React, { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth/useAuth';
import { CurrentAuthMethods } from './components/CurrentAuthMethods';
import { LinkEmailForm } from './components/LinkEmailForm';
import { LinkGoogleButton } from './components/LinkGoogleButton';
import { unlinkIdentity } from './utils/authMethodsUtils';

export const AuthMethodsManager: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Check what auth methods are currently linked
  const hasEmail = !!user?.email;
  const hasGoogle = user?.app_metadata?.providers?.includes('google');

  const handleUnlinkIdentity = async (provider: string) => {
    setIsLoading(true);
    try {
      await unlinkIdentity(provider);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Authentication Methods
        </CardTitle>
        <CardDescription>
          Manage how you sign in to your account. You can link multiple authentication methods for easier access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Methods */}
        <CurrentAuthMethods
          user={user}
          onUnlinkIdentity={handleUnlinkIdentity}
          isLoading={isLoading}
        />

        <Separator />

        {/* Add New Methods */}
        <div>
          <h4 className="text-sm font-medium mb-3">Add Authentication Methods</h4>
          
          {/* Link Email/Password */}
          <LinkEmailForm
            isVisible={!hasEmail}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />

          {/* Link Google */}
          <LinkGoogleButton
            isVisible={!hasGoogle}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
};
