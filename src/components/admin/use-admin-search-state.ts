"use client";

import { useEffect, useRef, useState } from "react";

interface UseAdminSearchStateOptions {
  debounceMs?: number;
  initialValue?: string;
}

export function useAdminSearchState({
  debounceMs = 400,
  initialValue = "",
}: UseAdminSearchStateOptions = {}) {
  const timeoutIdRef = useRef<number | null>(null);
  const [searchInputValue, setSearchInputValueState] = useState(initialValue);
  const [searchQueryValue, setSearchQueryValue] = useState(initialValue);

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  function setSearchInputValue(nextValue: string) {
    setSearchInputValueState(nextValue);

    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (!nextValue.trim()) {
      setSearchQueryValue("");
      return;
    }

    timeoutIdRef.current = window.setTimeout(() => {
      setSearchQueryValue(nextValue);
      timeoutIdRef.current = null;
    }, debounceMs);
  }

  function clearSearchValue() {
    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    setSearchInputValueState("");
    setSearchQueryValue("");
  }

  return {
    clearSearchValue,
    searchInputValue,
    searchQueryValue,
    setSearchInputValue,
  };
}
