
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuthHandlers } from '@/hooks/auth/useAuthHandlers';

interface PhoneOtpViewProps {
  phoneNumber: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const PhoneOtpView: React.FC<PhoneOtpViewProps> = ({
  phoneNumber,
  onBack,
  onSuccess,
}) => {
  const { isLoading, handleOtpVerification, handleResendOtp } = useAuthHandlers();
  const [otp, setOtp] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleOtpVerification(phoneNumber, otp, onSuccess);
  };

  const handleResend = () => {
    handleResendOtp(phoneNumber);
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
          Enter code sent to {phoneNumber}
        </span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp-code">Verification Code</Label>
          <Input
            id="otp-code"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            maxLength={6}
            required
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify OTP & Continue
        </Button>
        
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={isLoading}
        >
          Resend OTP
        </Button>
      </form>
    </>
  );
};
