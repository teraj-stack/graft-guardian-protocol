import { useCallback, useEffect, useState } from "react";

export type FilterPreset = {
  id: string;
  name: string;
  week: number | "all";
  cat: string;
  type: string;
  q: string;
};

const STORAGE_KEY = "graftgen.panel.filterPresets.v1";
const MAX_PRESETS = 12;

function read(): FilterPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is FilterPreset =>
        p && typeof p.id === "string" && typeof p.name === "string" && typeof p.cat === "string",
    );
  } catch {
    return [];
  }
}

export function usePanelFilterPresets() {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPresets(read());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: FilterPreset[]) => {
    setPresets(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const savePreset = useCallback(
    (preset: Omit<FilterPreset, "id">) => {
      const name = preset.name.trim().slice(0, 40);
      if (!name) return;
      const next = read().filter((p) => p.name.toLowerCase() !== name.toLowerCase());
      next.unshift({ ...preset, name, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` });
      persist(next.slice(0, MAX_PRESETS));
    },
    [persist],
  );

  const removePreset = useCallback(
    (id: string) => {
      persist(read().filter((p) => p.id !== id));
    },
    [persist],
  );

  return { presets, hydrated, savePreset, removePreset };
}
