import type { Pokemon, RankedPokemon } from "@/services/pokemon";

const W = 1200;
const H = 630;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

export async function buildTopTenShareCard(
  rankings: (Pokemon | RankedPokemon)[]
): Promise<Blob> {
  const top = rankings.slice(0, 10);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#1e1b4b");
  grad.addColorStop(1, "#7c3aed");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px system-ui, sans-serif";
  ctx.fillText("My Top 10 Pokémon", 60, 90);
  ctx.font = "24px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("PokeRank Mania", 60, 130);

  // Layout: 5 columns x 2 rows
  const cols = 5;
  const cellW = (W - 120) / cols;
  const cellH = 200;
  const startY = 180;

  await Promise.all(
    top.map(async (p, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 60 + col * cellW;
      const y = startY + row * (cellH + 20);

      // Card bg
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      roundRect(ctx, x, y, cellW - 12, cellH, 16);
      ctx.fill();

      // Image
      try {
        const img = await loadImage((p as Pokemon).image);
        const imgSize = 130;
        ctx.drawImage(img, x + (cellW - 12 - imgSize) / 2, y + 10, imgSize, imgSize);
      } catch {
        /* fallback: skip image */
      }

      // Rank badge
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(x + 24, y + 24, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1e1b4b";
      ctx.font = "bold 18px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), x + 24, y + 25);

      // Name
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px system-ui, sans-serif";
      const name = (p as Pokemon).name ?? "";
      ctx.fillText(truncate(ctx, name, cellW - 32), x + (cellW - 12) / 2, y + cellH - 16);
    })
  );

  // Footer
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "20px system-ui, sans-serif";
  ctx.fillText("poke-rank-mania.lovable.app", W - 60, H - 30);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

export async function shareTopTen(rankings: (Pokemon | RankedPokemon)[]): Promise<"shared" | "downloaded"> {
  const blob = await buildTopTenShareCard(rankings);
  const file = new File([blob], "my-top-10-pokemon.png", { type: "image/png" });

  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean; share?: (d: ShareData) => Promise<void> };
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({
        files: [file],
        title: "My Top 10 Pokémon",
        text: "Check out my Top 10 ranked on PokeRank Mania!",
      });
      return "shared";
    } catch {
      // fall through to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "my-top-10-pokemon.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}