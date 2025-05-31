
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuthHandlers } from '@/hooks/auth/useAuthHandlers';

interface PhoneInputViewProps {
  onBack: () => void;
  onSuccess: (phoneNumber: string) => void;
}

export const PhoneInputView: React.FC<PhoneInputViewProps> = ({
  onBack,
  onSuccess,
}) => {
  const { isLoading, handlePhoneSubmit } = useAuthHandlers();
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handlePhoneSubmit(phoneNumber, onSuccess);
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Sign in with phone number
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone-number">Phone Number</Label>
          <Input
            id="phone-number"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 123-4567"
            required
          />
          <p className="text-xs text-muted-foreground">
            Include your country code (e.g., +1 for US/Canada)
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send OTP
        </Button>
      </form>
    </>
  );
};
