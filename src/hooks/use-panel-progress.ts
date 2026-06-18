import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "panel-progress-v1";

export interface PanelProgress {
  materials: string[];
  weeks: number[];
}

const EMPTY: PanelProgress = { materials: [], weeks: [] };

function read(): PanelProgress {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<PanelProgress>;
    return {
      materials: Array.isArray(parsed.materials) ? parsed.materials.filter((x) => typeof x === "string") : [],
      weeks: Array.isArray(parsed.weeks) ? parsed.weeks.filter((x) => typeof x === "number") : [],
    };
  } catch {
    return EMPTY;
  }
}

function write(value: PanelProgress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function usePanelProgress() {
  const [progress, setProgress] = useState<PanelProgress>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProgress(read());
    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setProgress(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((next: PanelProgress) => {
    setProgress(next);
    write(next);
  }, []);

  const toggleMaterial = useCallback(
    (id: string) => {
      const exists = progress.materials.includes(id);
      const materials = exists ? progress.materials.filter((x) => x !== id) : [...progress.materials, id];
      update({ ...progress, materials });
    },
    [progress, update]
  );

  const toggleWeek = useCallback(
    (week: number) => {
      const exists = progress.weeks.includes(week);
      const weeks = exists ? progress.weeks.filter((x) => x !== week) : [...progress.weeks, week];
      update({ ...progress, weeks });
    },
    [progress, update]
  );

  const reset = useCallback(() => update(EMPTY), [update]);

  return {
    progress,
    hydrated,
    toggleMaterial,
    toggleWeek,
    reset,
    isMaterialDone: (id: string) => progress.materials.includes(id),
    isWeekDone: (week: number) => progress.weeks.includes(week),
  };
}
