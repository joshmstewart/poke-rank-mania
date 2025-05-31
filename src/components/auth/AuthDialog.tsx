
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, User } from 'lucide-react';
import { AuthMethodsView } from './AuthMethodsView';
import { PhoneInputView } from './PhoneInputView';
import { PhoneOtpView } from './PhoneOtpView';
import { AuthenticatedUserDisplay } from './AuthenticatedUserDisplay';

interface AuthDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type AuthView = 'methods' | 'phone-input' | 'phone-otp';

export const AuthDialog: React.FC<AuthDialogProps> = ({ 
  children, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange 
}) => {
  const { user, loading } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AuthView>('methods');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;

  const resetForm = () => {
    setPhoneNumber('');
    setCurrentView('methods');
  };

  const handleSuccess = () => {
    setIsOpen(false);
    resetForm();
  };

  const handlePhoneSuccess = (formattedPhone: string) => {
    setPhoneNumber(formattedPhone);
    setCurrentView('phone-otp');
  };

  const handleBackToMethods = () => {
    setCurrentView('methods');
  };

  const handleBackToPhone = () => {
    setCurrentView('phone-input');
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (user) {
    return <AuthenticatedUserDisplay />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'methods':
        return (
          <AuthMethodsView
            onPhoneClick={() => setCurrentView('phone-input')}
            onSuccess={handleSuccess}
          />
        );
      case 'phone-input':
        return (
          <PhoneInputView
            onBack={handleBackToMethods}
            onSuccess={handlePhoneSuccess}
          />
        );
      case 'phone-otp':
        return (
          <PhoneOtpView
            phoneNumber={phoneNumber}
            onBack={handleBackToPhone}
            onSuccess={handleSuccess}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Save Your Progress
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
