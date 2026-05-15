import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Info, Star, Trash2 } from "lucide-react";

interface CardActionMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: "available" | "ranked";
  isStarred: boolean;
  canStar: boolean;
  onInfo: () => void;
  onToggleStar: () => void;
  onRemove?: () => void;
  /** Anchor element ref — the trigger is positioned over it. */
  anchorRect: DOMRect | null;
}

/**
 * Long-press action menu for a Pokémon card on touch devices.
 * Anchored to the card via a fixed-position invisible trigger.
 */
export const CardActionMenu: React.FC<CardActionMenuProps> = ({
  open,
  onOpenChange,
  context,
  isStarred,
  canStar,
  onInfo,
  onToggleStar,
  onRemove,
  anchorRect,
}) => {
  if (!anchorRect && !open) return null;

  const triggerStyle: React.CSSProperties = anchorRect
    ? {
        position: "fixed",
        left: anchorRect.left + anchorRect.width / 2,
        top: anchorRect.top + anchorRect.height / 2,
        width: 1,
        height: 1,
        pointerEvents: "none",
      }
    : { position: "fixed", left: -9999, top: -9999 };

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <span aria-hidden style={triggerStyle} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        side="top"
        sideOffset={8}
        collisionPadding={12}
        className="w-48"
      >
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onOpenChange(false);
            onInfo();
          }}
          className="gap-2"
        >
          <Info className="h-4 w-4" /> Info
        </DropdownMenuItem>
        {canStar && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onOpenChange(false);
              onToggleStar();
            }}
            className="gap-2"
          >
            <Star
              className={`h-4 w-4 ${isStarred ? "fill-yellow-500 text-yellow-500" : ""}`}
            />
            {isStarred ? "Unstar" : "Star"}
          </DropdownMenuItem>
        )}
        {context === "ranked" && onRemove && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onOpenChange(false);
              onRemove();
            }}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Remove from rankings
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CardActionMenu;