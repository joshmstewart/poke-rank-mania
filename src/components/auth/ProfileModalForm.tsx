
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface ProfileModalFormProps {
  selectedAvatar: string;
  setSelectedAvatar: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  displayName: string;
  setDisplayName: (value: string) => void;
  onAvatarClick: () => void;
}

export const ProfileModalForm: React.FC<ProfileModalFormProps> = ({
  selectedAvatar,
  setSelectedAvatar,
  username,
  setUsername,
  displayName,
  setDisplayName,
  onAvatarClick
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onAvatarClick}
          className="rounded-full transition-transform hover:scale-105"
        >
          <Avatar className="h-16 w-16">
            <AvatarImage src={selectedAvatar} alt="Selected avatar" />
            <AvatarFallback>
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
        </button>
        <div>
          <p className="font-medium">Current Avatar</p>
          <p className="text-sm text-muted-foreground">
            {selectedAvatar ? 'Trainer Avatar' : 'No avatar selected'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Click your avatar to change it
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display-name">Display Name</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your trainer name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
          />
        </div>
      </div>
    </div>
  );
};
