import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { winner, loser } = body as { winner?: string; loser?: string };

    const safeWinner = typeof winner === "string" ? winner.slice(0, 40) : "";
    const safeLoser = typeof loser === "string" ? loser.slice(0, 40) : "";

    if (!safeWinner || !safeLoser) {
      return json({ error: "winner and loser required" }, 400);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI not configured" }, 500);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are Professor Oak from Pokémon, narrating a head-to-head battle. Reply with ONE short, witty, family-friendly sentence (max 18 words). No emojis. No quotes. No preamble.",
          },
          {
            role: "user",
            content: `${safeWinner} just defeated ${safeLoser}. React.`,
          },
        ],
        temperature: 0.9,
        max_tokens: 60,
      }),
    });

    if (aiResponse.status === 429) return json({ error: "Rate limited" }, 429);
    if (aiResponse.status === 402) return json({ error: "AI credits exhausted" }, 402);
    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      console.error("AI error", aiResponse.status, text);
      return json({ error: "AI request failed" }, 500);
    }

    const data = await aiResponse.json();
    const quip = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return json({ quip });
  } catch (err) {
    console.error("professor-oak-quip error", err);
    return json({ error: "internal" }, 500);
  }
});