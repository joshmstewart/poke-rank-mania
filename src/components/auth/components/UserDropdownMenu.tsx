
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';

interface UserDropdownMenuProps {
  displayValues: {
    displayName: string;
    displayIdentifier: string;
    avatarUrl?: string;
  } | null;
  onProfileClick: () => void;
  onAvatarClick: () => void;
  onSignOut: () => void;
}

export const UserDropdownMenu: React.FC<UserDropdownMenuProps> = ({
  displayValues,
  onProfileClick,
  onAvatarClick,
  onSignOut
}) => {
  if (!displayValues) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onAvatarClick}
        className="rounded-full transition-transform hover:scale-105"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={displayValues.avatarUrl || undefined} alt={displayValues.displayName} />
          <AvatarFallback className="bg-blue-500 text-white">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
            <span className="text-sm font-medium hidden sm:inline">
              {displayValues.displayName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onProfileClick}>
            <Settings className="mr-2 h-4 w-4" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
</DropdownMenu>
