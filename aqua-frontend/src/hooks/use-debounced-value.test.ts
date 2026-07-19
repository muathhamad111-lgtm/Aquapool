import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./use-debounced-value";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedValue", () => {
  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("زيد"));

    expect(result.current).toBe("زيد");
  });

  it("does not update before the delay elapses", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "ab" });
    act(() => void vi.advanceTimersByTime(299));

    expect(result.current).toBe("a");
  });

  it("updates once the delay elapses", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "ab" });
    act(() => void vi.advanceTimersByTime(300));

    expect(result.current).toBe("ab");
  });

  /**
   * The point of the hook: a burst of keystrokes must produce exactly one
   * settled value, not one per keystroke. Each change has to cancel the
   * pending timer, which is what the effect's cleanup does.
   */
  it("collapses a burst of changes into a single final value", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "" },
    });

    for (const value of ["م", "مس", "مسب", "مسبح"]) {
      rerender({ value });
      act(() => void vi.advanceTimersByTime(100)); // never reaches 300
    }

    expect(result.current).toBe("");

    act(() => void vi.advanceTimersByTime(300));

    expect(result.current).toBe("مسبح");
  });

  it("honours a custom delay", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 1000), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    act(() => void vi.advanceTimersByTime(300));
    expect(result.current).toBe("a");

    act(() => void vi.advanceTimersByTime(700));
    expect(result.current).toBe("b");
  });
});
