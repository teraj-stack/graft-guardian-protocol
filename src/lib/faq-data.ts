import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FAQ_META, STAGE_KEYS, TOPIC_KEYS, DAY_MATCH, type StageKey, type TopicKey } from "./faq-meta";

// ----- Backward-compatible PL types/exports (used by server-side code & legacy callers) -----
export type Stage = "Dzień 0-3" | "Dzień 4-14" | "Miesiąc 1+";
export type Topic = "LED" | "HBOT" | "LADD/PRP" | "pielęgnacja domowa" | "gojenie";

export const STAGES: Stage[] = ["Dzień 0-3", "Dzień 4-14", "Miesiąc 1+"];
export const TOPICS: Topic[] = ["LED", "HBOT", "LADD/PRP", "pielęgnacja domowa", "gojenie"];

const STAGE_PL: Record<StageKey, Stage> = {
  day0_3: "Dzień 0-3",
  day4_14: "Dzień 4-14",
  month1plus: "Miesiąc 1+",
};
const TOPIC_PL: Record<TopicKey, Topic> = {
  led: "LED",
  hbot: "HBOT",
  ladd_prp: "LADD/PRP",
  home_care: "pielęgnacja domowa",
  healing: "gojenie",
};

export type FaqItem = { id: string; q: string; a: string; stages: Stage[]; topics: Topic[] };

// Static PL export — preserves API for non-React/server-side consumers.
// Texts pulled from src/locales/pl.json via a lazy import would force JSON cycles;
// instead we duplicate PL strings here only for backward compatibility.
import plLocale from "@/locales/pl.json";
const plItems = (plLocale as any).faq.items as Record<string, { q: string; a: string }>;

export const FAQ: FaqItem[] = FAQ_META.map((m) => ({
  id: m.id,
  q: plItems[m.id]?.q ?? m.id,
  a: plItems[m.id]?.a ?? "",
  stages: m.stages.map((s) => STAGE_PL[s]),
  topics: m.topics.map((t) => TOPIC_PL[t]),
}));

// ----- Localized hook for UI components -----
export type LocalizedFaqItem = {
  id: string;
  q: string;
  a: string;
  stageKeys: StageKey[];
  topicKeys: TopicKey[];
};

export type LocalizedFaq = {
  items: LocalizedFaqItem[];
  stages: { key: StageKey; label: string }[];
  topics: { key: TopicKey; label: string }[];
  /** Day index (0–14) → regex matching localized FAQ text */
  dayMatch: RegExp[];
};

export function useFaq(): LocalizedFaq {
  const { t, i18n } = useTranslation();
  return useMemo(() => {
    const items: LocalizedFaqItem[] = FAQ_META.map((m) => ({
      id: m.id,
      q: t(`faq.items.${m.id}.q`, { defaultValue: plItems[m.id]?.q ?? m.id }),
      a: t(`faq.items.${m.id}.a`, { defaultValue: plItems[m.id]?.a ?? "" }),
      stageKeys: m.stages,
      topicKeys: m.topics,
    }));
    return {
      items,
      stages: STAGE_KEYS.map((key) => ({ key, label: t(`faq.stages.${key}`) })),
      topics: TOPIC_KEYS.map((key) => ({ key, label: t(`faq.topics.${key}`) })),
      dayMatch: DAY_MATCH,
    };
    // i18n.language drives re-computation when language changes
  }, [t, i18n.language]);
}
