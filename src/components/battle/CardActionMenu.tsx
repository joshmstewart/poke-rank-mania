import React from "react";
import { createPortal } from "react-dom";
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
 * Uses a direct fixed-position portal so touch coordinates are never adjusted
 * by the card/grid scroll position or dnd-kit transforms.
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
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const menuPosition = React.useMemo(() => {
    const menuWidth = 192;
    const rowHeight = 44;
    const itemCount = 1 + (canStar ? 1 : 0) + (context === "ranked" && onRemove ? 1 : 0);
    const estimatedHeight = itemCount * rowHeight + 8;

    if (!anchorRect || typeof window === "undefined") {
      return { left: -9999, top: -9999 };
    }

    const padding = 8;
    const gap = 12;
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const rawLeft = anchorRect.left - menuWidth / 2;
    const left = Math.min(Math.max(rawLeft, padding), viewportWidth - menuWidth - padding);
    const topAbove = anchorRect.top - estimatedHeight - gap;
    const topBelow = anchorRect.top + gap;
    const top = topAbove >= padding
      ? topAbove
      : Math.min(topBelow, viewportHeight - estimatedHeight - padding);

    return { left, top: Math.max(padding, top) };
  }, [anchorRect, canStar, context, onRemove]);

  const runAction = React.useCallback((action: () => void) => {
    onOpenChange(false);
    action();
  }, [onOpenChange]);

  const stopMenuEvent = React.useCallback((event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  if (!open || !anchorRect || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpenChange(false);
      }}
      onClick={stopMenuEvent}
    >
      <div
        ref={menuRef}
        role="menu"
        aria-orientation="vertical"
        className="fixed w-48 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        style={{ left: menuPosition.left, top: menuPosition.top }}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onClick={stopMenuEvent}
      >
        <button
          type="button"
          role="menuitem"
          className="flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-left text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground"
          onPointerUp={(event) => {
            stopMenuEvent(event);
            runAction(onInfo);
          }}
        >
          <Info className="h-4 w-4" />
          <span>Info</span>
        </button>
        {canStar && (
          <button
            type="button"
            role="menuitem"
            className="flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-left text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground"
            onPointerUp={(event) => {
              stopMenuEvent(event);
              runAction(onToggleStar);
            }}
          >
            <Star
              className={`h-4 w-4 ${isStarred ? "fill-primary text-primary" : ""}`}
            />
            <span>{isStarred ? "Unstar" : "Star"}</span>
          </button>
        )}
        {context === "ranked" && onRemove && (
          <button
            type="button"
            role="menuitem"
            className="flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-left text-sm text-destructive outline-none transition-colors hover:bg-accent focus:bg-accent"
            onPointerUp={(event) => {
              stopMenuEvent(event);
              runAction(onRemove);
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span>Remove from rankings</span>
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

export default CardActionMenu;