import { describe, expect, it } from "vitest";
import { entityCountsFrom } from "./audit-logs-api";
import { statusCountsFrom } from "./messages-api";

/**
 * Both helpers read a per-category count map out of a paginated response's
 * `meta` and derive the "all" total from it. They back the filter chips on
 * the audit-log and messages pages, which must keep showing whole-table
 * totals while a filter is active.
 */
describe("entityCountsFrom", () => {
  it("sums the per-entity counts into an all total", () => {
    const counts = entityCountsFrom({ entity_counts: { product: 900, service: 640, user: 300 } });

    expect(counts).toEqual({ product: 900, service: 640, user: 300, all: 1840 });
  });

  it("returns an all of zero when meta is missing", () => {
    // First render, before the query resolves — the chips must render 0,
    // not NaN or undefined.
    expect(entityCountsFrom(undefined)).toEqual({ all: 0 });
  });

  it("returns an all of zero when the table is empty", () => {
    expect(entityCountsFrom({ entity_counts: {} })).toEqual({ all: 0 });
  });
});

describe("statusCountsFrom", () => {
  it("sums the per-status counts into an all total", () => {
    const counts = statusCountsFrom({
      status_counts: { new: 12, in_progress: 3, replied: 300, archived: 25 },
    });

    expect(counts).toEqual({ new: 12, in_progress: 3, replied: 300, archived: 25, all: 340 });
  });

  it("keeps zero-valued statuses rather than dropping them", () => {
    // The API always sends every status, zero included, so a chip can index
    // the map directly instead of treating a missing key as zero.
    const counts = statusCountsFrom({
      status_counts: { new: 0, in_progress: 0, replied: 5, archived: 0 },
    });

    expect(counts.new).toBe(0);
    expect(counts.all).toBe(5);
  });

  it("returns an all of zero when meta is missing", () => {
    expect(statusCountsFrom(undefined)).toEqual({ all: 0 });
  });
});
