
import React from "react";

interface PokemonCardEventsProps {
  pokemonName: string;
  pokemonId: number;
  listeners: any;
}

export const usePokemonCardEvents = ({ pokemonName, pokemonId, listeners }: PokemonCardEventsProps) => {
  const handlePointerDown = (e: React.PointerEvent) => {
    console.log(`🚨 [EVENT_FLOW_DEBUG] ===== ${pokemonName} POINTER DOWN START =====`);
    console.log(`🚨 [EVENT_FLOW_DEBUG] Event details:`, {
      type: e.type,
      button: e.button,
      isPrimary: e.isPrimary,
      pressure: e.pressure,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target?.constructor?.name,
      currentTarget: e.currentTarget?.constructor?.name,
      bubbles: e.bubbles,
      cancelable: e.cancelable,
      defaultPrevented: e.defaultPrevented
    });

    if (listeners?.onPointerDown) {
      console.log(`🚨 [EVENT_FLOW_DEBUG] ✅ dnd-kit onPointerDown exists for ${pokemonName}`);
      console.log(`🚨 [EVENT_FLOW_DEBUG] Listener type:`, typeof listeners.onPointerDown);
      
      try {
        console.log(`🚨 [EVENT_FLOW_DEBUG] 🚀 CALLING dnd-kit onPointerDown...`);
        listeners.onPointerDown(e);
        console.log(`🚨 [EVENT_FLOW_DEBUG] ✅ dnd-kit onPointerDown called successfully`);
      } catch (error) {
        console.error(`🚨 [EVENT_FLOW_DEBUG] ❌ Error calling dnd-kit onPointerDown:`, error);
      }
    } else {
      console.error(`🚨 [EVENT_FLOW_DEBUG] ❌ NO onPointerDown listener for ${pokemonName}!`);
      console.error(`🚨 [EVENT_FLOW_DEBUG] Available listeners:`, Object.keys(listeners || {}));
    }

    console.log(`🚨 [EVENT_FLOW_DEBUG] Event after dnd-kit processing:`, {
      defaultPrevented: e.defaultPrevented,
      propagationStopped: e.isPropagationStopped?.() || 'unknown'
    });

    console.log(`🚨 [EVENT_FLOW_DEBUG] ===== ${pokemonName} POINTER DOWN END =====`);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log(`🚨 [EVENT_FLOW_DEBUG] ${pokemonName} MOUSE DOWN:`, {
      button: e.button,
      buttons: e.buttons,
      detail: e.detail,
      clientX: e.clientX,
      clientY: e.clientY
    });
    
    if (listeners?.onMouseDown) {
      console.log(`🚨 [EVENT_FLOW_DEBUG] Calling dnd-kit onMouseDown for ${pokemonName}`);
      listeners.onMouseDown(e);
    } else {
      console.error(`🚨 [EVENT_FLOW_DEBUG] No onMouseDown listener for ${pokemonName}`);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    console.log(`🚨 [EVENT_FLOW_DEBUG] ${pokemonName} TOUCH START:`, {
      touches: e.touches.length,
      changedTouches: e.changedTouches.length,
      targetTouches: e.targetTouches.length
    });
    
    if (listeners?.onTouchStart) {
      console.log(`🚨 [EVENT_FLOW_DEBUG] Calling dnd-kit onTouchStart for ${pokemonName}`);
      listeners.onTouchStart(e);
    } else {
      console.error(`🚨 [EVENT_FLOW_DEBUG] No onTouchStart listener for ${pokemonName}`);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    console.log(`🚨 [EVENT_FLOW_DEBUG] ${pokemonName} CLICK:`, {
      button: e.button,
      detail: e.detail,
      clientX: e.clientX,
      clientY: e.clientY,
      defaultPrevented: e.defaultPrevented
    });
  };

  return {
    handlePointerDown,
    handleMouseDown,
    handleTouchStart,
    handleClick
  };
};
