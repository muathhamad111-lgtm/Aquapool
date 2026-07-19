import { useEffect, useState } from "react";

/**
 * Trails `value` by `delay` ms. Used to keep a search box responsive while
 * the query it drives hits the server only once the user stops typing.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
