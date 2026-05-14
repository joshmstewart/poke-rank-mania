import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { pokemonName, firstCard, secondCard } = body as {
      pokemonName?: string;
      firstCard?: unknown;
      secondCard?: unknown;
    };

    if (!pokemonName || typeof pokemonName !== "string" || pokemonName.length > 100) {
      return json({ error: "Invalid pokemonName" }, 400);
    }
    if (!firstCard) {
      return json({ error: "firstCard required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { error } = await supabase
      .from("tcg_cards_cache")
      .upsert(
        {
          pokemon_name: pokemonName.toLowerCase(),
          card_data: firstCard,
          second_card_data: secondCard ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "pokemon_name" },
      );

    if (error) {
      console.error("[cache-tcg-card] upsert error", error);
      return json({ error: error.message }, 500);
    }

    return json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cache-tcg-card] error", err);
    return json({ error: message }, 500);
  }
});