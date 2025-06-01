
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera } from 'lucide-react';
import { useAuth } from '@/contexts/auth/useAuth';

interface ProfileAvatarSectionProps {
  selectedAvatar: string;
  displayName: string;
  onAvatarClick: () => void;
}

export const ProfileAvatarSection: React.FC<ProfileAvatarSectionProps> = ({
  selectedAvatar,
  displayName,
  onAvatarClick
}) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <div 
          className="relative border-2 border-dashed border-gray-300 rounded-full p-1 cursor-pointer transition-all hover:border-gray-400 hover:bg-gray-50 group-hover:border-gray-400"
          onClick={onAvatarClick}
        >
          <Avatar className="h-24 w-24">
            <AvatarImage src={selectedAvatar} alt="Profile avatar" />
            <AvatarFallback className="text-lg">
              {displayName ? displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all">
            <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground text-center">
        Click your avatar to change it
      </p>
    </div>
  );
};
