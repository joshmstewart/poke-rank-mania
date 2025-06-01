
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { getPokemonAvatars } from '@/services/pokemonAvatars';

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
  const [avatarUrls, setAvatarUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Update selectedAvatar when currentAvatar changes or modal opens
  useEffect(() => {
    if (open) {
      setSelectedAvatar(currentAvatar);
    }
  }, [open, currentAvatar]);

  useEffect(() => {
    const loadAvatars = async () => {
      try {
        setLoading(true);
        const urls = await getPokemonAvatars();
        setAvatarUrls(urls);
      } catch (error) {
        console.error('Failed to load avatars:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadAvatars();
    }
  }, [open]);

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
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-sm text-gray-500">Loading avatars...</div>
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-3">
                {avatarUrls.map((avatarUrl, index) => (
                  <div
                    key={`${avatarUrl}-${index}`}
                    className="relative flex justify-center items-center"
                  >
                    <button
                      onClick={() => setSelectedAvatar(avatarUrl)}
                      className={`relative w-16 h-16 rounded-full transition-all duration-200 hover:scale-110 ${
                        selectedAvatar === avatarUrl
                          ? 'ring-4 ring-blue-500 ring-offset-2'
                          : 'hover:ring-2 hover:ring-blue-300'
                      }`}
                    >
                      <Avatar className="w-16 h-16">
                        <AvatarImage 
                          src={avatarUrl} 
                          alt={`Pokemon avatar ${index + 1}`}
                          className="object-cover border-2 border-gray-200"
                        />
                      </Avatar>
                      {selectedAvatar === avatarUrl && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-4 text-center">
              End of avatar selection
            </div>
          </ScrollArea>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSelect} disabled={loading}>
              Select Avatar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
