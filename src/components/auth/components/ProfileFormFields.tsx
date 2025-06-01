
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ValidationErrors {
  username?: string;
  displayName?: string;
  general?: string;
}

interface ProfileFormFieldsProps {
  username: string;
  setUsername: (username: string) => void;
  displayName: string;
  setDisplayName: (displayName: string) => void;
  validationErrors: ValidationErrors;
}

export const ProfileFormFields: React.FC<ProfileFormFieldsProps> = ({
  username,
  setUsername,
  displayName,
  setDisplayName,
  validationErrors
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          className={validationErrors.username ? 'border-red-500' : ''}
        />
        {validationErrors.username && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.username}</p>
        )}
      </div>

      <div>
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter display name"
          className={validationErrors.displayName ? 'border-red-500' : ''}
        />
        {validationErrors.displayName && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.displayName}</p>
        )}
      </div>

      {validationErrors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{validationErrors.general}</p>
        </div>
      )}
    </div>
  );
};
