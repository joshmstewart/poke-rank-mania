
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Loader2 } from 'lucide-react';
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
  const [avatars, setAvatars] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadAvatars();
    }
  }, [open]);

  const loadAvatars = async () => {
    setLoading(true);
    try {
      const pokemonAvatars = await getPokemonAvatars();
      setAvatars(pokemonAvatars);
    } catch (error) {
      console.error('Failed to load avatar options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAvatar = (avatarUrl: string) => {
    onSelectAvatar(avatarUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading Pokemon avatars...</span>
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-4 max-h-96 overflow-y-auto">
              {avatars.map((avatarUrl, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAvatar(avatarUrl)}
                  className={`relative rounded-full p-1 transition-all hover:scale-110 ${
                    currentAvatar === avatarUrl ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={avatarUrl} alt={`Pokemon avatar ${index + 1}`} />
                    <AvatarFallback>
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
