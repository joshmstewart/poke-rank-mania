import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEnhancedRankingDragDrop } from "../useEnhancedRankingDragDrop";
import { rankedId, availableId } from "@/utils/id";

/**
 * Guards the strict DnD ID prefix contract from project knowledge:
 *   ranked-{dex}    → reorder within rankings
 *   available-{dex} → insert from available into rankings
 * Anything else MUST be ignored.
 */

const makePokemon = (id: number, name = `p${id}`) => ({
  id,
  name,
  image: "",
  types: [],
});

const buildEvent = (
  activeId: string,
  overId: string | null,
  overType: string,
  overIndex?: number
) => ({
  active: {
    id: activeId,
    data: { current: { type: activeId.startsWith("ranked-") ? "ranked-pokemon" : "available-pokemon" } },
  },
  over: overId
    ? { id: overId, data: { current: { type: overType, index: overIndex } } }
    : null,
}) as any;

describe("useEnhancedRankingDragDrop — DnD ID prefix contract", () => {
  let setAvailable: ReturnType<typeof vi.fn>;
  let handleReorder: ReturnType<typeof vi.fn>;
  let triggerReRanking: ReturnType<typeof vi.fn>;
  let updateLocalRankings: ReturnType<typeof vi.fn>;

  const available = [makePokemon(25, "pikachu"), makePokemon(6, "charizard")];
  const ranked = [makePokemon(150, "mewtwo"), makePokemon(1, "bulbasaur")];

  beforeEach(() => {
    setAvailable = vi.fn();
    handleReorder = vi.fn();
    triggerReRanking = vi.fn().mockResolvedValue(undefined);
    updateLocalRankings = vi.fn();
  });

  const setup = () =>
    renderHook(() =>
      useEnhancedRankingDragDrop(
        available,
        ranked,
        setAvailable as any,
        handleReorder as any,
        triggerReRanking as any,
        updateLocalRankings as any
      )
    );

  it("reorders within rankings when ranked- card is dropped on another ranked- card", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.handleDragEnd(
        buildEvent(rankedId(1), rankedId(150), "ranked-pokemon")
      );
    });
    expect(handleReorder).toHaveBeenCalledTimes(1);
    expect(handleReorder).toHaveBeenCalledWith(1, 1, 0);
  });

  it("inserts from available when available- card is dropped on a ranking-position", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.handleDragEnd(
        buildEvent(availableId(25), rankedId(150), "ranking-position", 0)
      );
    });
    expect(setAvailable).toHaveBeenCalled(); // moveFromAvailableToRankings updates available
  });

  it("ignores drops with no over target", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.handleDragEnd(buildEvent(rankedId(1), null, "none"));
    });
    expect(handleReorder).not.toHaveBeenCalled();
    expect(setAvailable).not.toHaveBeenCalled();
  });

  it("ignores drops where active is dropped on itself", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.handleDragEnd(
        buildEvent(rankedId(1), rankedId(1), "ranked-pokemon")
      );
    });
    expect(handleReorder).not.toHaveBeenCalled();
  });

  it("ignores ranked-on-ranked drops when source is not in rankings (unknown id)", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.handleDragEnd(
        buildEvent(rankedId(9999), rankedId(150), "ranked-pokemon")
      );
    });
    // findIndex returns -1 → guard prevents reorder
    expect(handleReorder).not.toHaveBeenCalled();
  });
});