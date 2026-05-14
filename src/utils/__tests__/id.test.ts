import { describe, it, expect } from "vitest";
import {
  rankedId,
  availableId,
  isRankedId,
  isAvailableId,
  dexFromId,
} from "@/utils/id";

describe("dnd id helpers", () => {
  it("produces the strict ranked- / available- prefixes", () => {
    expect(rankedId(25)).toBe("ranked-25");
    expect(availableId(6)).toBe("available-6");
  });

  it("identifies prefixes correctly", () => {
    expect(isRankedId("ranked-1")).toBe(true);
    expect(isRankedId("available-1")).toBe(false);
    expect(isAvailableId("available-1")).toBe(true);
    expect(isAvailableId("ranked-1")).toBe(false);
    expect(isRankedId("1")).toBe(false);
  });

  it("extracts the dex number from either prefix", () => {
    expect(dexFromId("ranked-150")).toBe(150);
    expect(dexFromId("available-7")).toBe(7);
    expect(dexFromId("bogus-7")).toBeNull();
    expect(dexFromId("ranked-")).toBeNull();
  });
});