
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { pokemonAvatars } from '@/services/pokemonAvatars';

interface AvatarSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatar: string;
  onSelectAvatar: (avatarUrl: string) => void;
}

export const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  open,
  onOpenChange,
  currentAvatar,
  onSelectAvatar
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  const handleSelect = () => {
    onSelectAvatar(selectedAvatar);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          <ScrollArea className="h-96 w-full rounded-md border p-4">
            <div className="text-sm text-gray-600 mb-3 text-center">
              Scroll down to see more Pokémon avatars
            </div>
            <div className="grid grid-cols-6 gap-3">
              {pokemonAvatars.map((avatar) => (
                <button
                  key={avatar.url}
                  onClick={() => setSelectedAvatar(avatar.url)}
                  className={`relative rounded-full transition-all duration-200 hover:scale-110 ${
                    selectedAvatar === avatar.url
                      ? 'ring-4 ring-blue-500 ring-offset-2'
                      : 'hover:ring-2 hover:ring-blue-300'
                  }`}
                >
                  <Avatar className="w-16 h-16">
                    <AvatarImage 
                      src={avatar.url} 
                      alt={avatar.name}
                      className="object-cover"
                    />
                  </Avatar>
                  {selectedAvatar === avatar.url && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-4 text-center">
              End of avatar selection
            </div>
          </ScrollArea>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSelect}>
              Select Avatar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
