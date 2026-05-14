import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportRankingsAsJson } from "@/utils/exportRankings";
import type { RankedPokemon } from "@/services/pokemon";

const makePokemon = (id: number, name: string, score: number): RankedPokemon =>
  ({
    id,
    name,
    score,
    confidence: 75,
    count: 10,
    image: "",
    types: [],
    wins: 0,
    losses: 0,
    winRate: 0,
    rating: { mu: 25, sigma: 8.33, battleCount: 10 } as any,
  } as unknown as RankedPokemon);

describe("exportRankingsAsJson", () => {
  let originalCreate: typeof URL.createObjectURL;
  let originalRevoke: typeof URL.revokeObjectURL;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalCreate = URL.createObjectURL;
    originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:mock");
    URL.revokeObjectURL = vi.fn();
    clickSpy = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      clickSpy as unknown as () => void
    );
  });

  afterEach(() => {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    vi.restoreAllMocks();
  });

  it("creates a downloadable JSON blob with rankings ordered by index", () => {
    const rankings = [
      makePokemon(25, "Pikachu", 30.1),
      makePokemon(6, "Charizard", 29.0),
    ];

    exportRankingsAsJson(rankings);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blob = (URL.createObjectURL as any).mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });

  it("does nothing destructive on empty input", () => {
    exportRankingsAsJson([]);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});