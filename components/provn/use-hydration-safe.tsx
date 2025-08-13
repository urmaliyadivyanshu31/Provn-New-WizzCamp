"use client";

import { useState, useEffect } from 'react';

export function useHydrationSafe() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

export function useClientOnly<T>(value: T, fallback: T): T {
  const isHydrated = useHydrationSafe();
  return isHydrated ? value : fallback;
}
