import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Listens for `battle-completed` events and asks the AI gateway for a
 * one-liner Professor Oak quip. Throttled to one quip every ~10s so users
 * aren't flooded during rapid battles. Silently no-ops on errors.
 */
export const BattleQuipListener = () => {
  const lastShownRef = useRef<number>(0);
  const inFlightRef = useRef<boolean>(false);

  useEffect(() => {
    const handler = async (event: Event) => {
      const detail = (event as CustomEvent<{ winner?: string; loser?: string }>).detail;
      if (!detail?.winner || !detail?.loser) return;

      const now = Date.now();
      if (inFlightRef.current) return;
      if (now - lastShownRef.current < 10_000) return;

      inFlightRef.current = true;
      try {
        const { data, error } = await supabase.functions.invoke("professor-oak-quip", {
          body: { winner: detail.winner, loser: detail.loser },
        });
        if (error || !data?.quip) return;
        lastShownRef.current = Date.now();
        toast({
          title: "Professor Oak",
          description: data.quip,
          duration: 4500,
        });
      } catch {
        // best-effort, ignore failures
      } finally {
        inFlightRef.current = false;
      }
    };

    document.addEventListener("battle-completed", handler);
    return () => document.removeEventListener("battle-completed", handler);
  }, []);

  return null;
};