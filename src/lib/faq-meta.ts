// Language-agnostic metadata for FAQ entries.
// Text (q/a) lives in src/locales/{pl,en,tr}.json under `faq.items`.
// Stages/topics use stable keys for filtering; their display labels are
// translated via `faq.stages.<key>` and `faq.topics.<key>`.

export type StageKey = "day0_3" | "day4_14" | "month1plus";
export type TopicKey = "led" | "hbot" | "ladd_prp" | "home_care" | "healing";

export const STAGE_KEYS: StageKey[] = ["day0_3", "day4_14", "month1plus"];
export const TOPIC_KEYS: TopicKey[] = ["led", "hbot", "ladd_prp", "home_care", "healing"];

export type FaqMeta = { id: string; stages: StageKey[]; topics: TopicKey[] };

export const FAQ_META: FaqMeta[] = [
  { id: "pbm-650-vs-830", stages: ["day0_3", "day4_14", "month1plus"], topics: ["led"] },
  { id: "first-wash", stages: ["day0_3"], topics: ["home_care"] },
  { id: "hbot-nfz", stages: ["day0_3"], topics: ["hbot"] },
  { id: "minoxidil-oral", stages: ["month1plus"], topics: ["ladd_prp"] },
  { id: "prp-in-holding", stages: ["day0_3"], topics: ["ladd_prp"] },
  { id: "hypothermosol", stages: ["day0_3"], topics: ["ladd_prp"] },
  { id: "tulium-vs-plasma", stages: ["month1plus"], topics: ["ladd_prp"] },
  { id: "alcohol-nicotine", stages: ["day0_3", "day4_14"], topics: ["home_care"] },
  { id: "final-result", stages: ["month1plus"], topics: ["home_care"] },
  { id: "sport-sauna-sun", stages: ["day4_14", "month1plus"], topics: ["home_care"] },
  { id: "first-48h-normal", stages: ["day0_3"], topics: ["healing"] },
  { id: "forehead-swelling", stages: ["day0_3"], topics: ["healing"] },
  { id: "pain-pressure", stages: ["day0_3"], topics: ["healing"] },
  { id: "scab-removal", stages: ["day4_14"], topics: ["healing"] },
  { id: "itching", stages: ["day4_14"], topics: ["healing"] },
  { id: "shock-loss", stages: ["day4_14", "month1plus"], topics: ["healing"] },
  { id: "call-clinic", stages: ["day0_3", "day4_14"], topics: ["healing", "home_care"] },
  { id: "sleep-position", stages: ["day0_3", "day4_14"], topics: ["home_care"] },
  { id: "day-0", stages: ["day0_3"], topics: ["home_care", "healing"] },
  { id: "day-1", stages: ["day0_3"], topics: ["home_care", "healing"] },
  { id: "day-2-hocl", stages: ["day0_3"], topics: ["home_care", "healing"] },
  { id: "day-3-swelling-peak", stages: ["day0_3"], topics: ["healing"] },
  { id: "day-4-first-wash", stages: ["day4_14"], topics: ["home_care"] },
  { id: "day-5-7-revasc", stages: ["day4_14"], topics: ["healing", "hbot", "led"] },
  { id: "day-8-10-massage", stages: ["day4_14"], topics: ["home_care", "led"] },
  { id: "day-11-14", stages: ["day4_14", "month1plus"], topics: ["healing", "home_care"] },
  { id: "post-erythema", stages: ["day4_14", "month1plus"], topics: ["healing"] },
  { id: "diet", stages: ["day0_3", "day4_14"], topics: ["home_care"] },
];

// Regex for matching FAQ entries to a selected day (0–14) in the timeline UI.
// Language-agnostic: matches Polish/English/Turkish keywords for each day.
export const DAY_MATCH: RegExp[] = [
  /(doba|day|gün)\s*0|day[- ]?zero/i, // day 0
  /(doba|day|gün)\s*1\b|day[- ]?1/i,
  /(doba|day|gün)\s*2|hocl/i,
  /(doba|day|gün)\s*3|swelling|obrzęk/i,
  /(doba|day|gün)\s*4|first[- ]wash|pierwsze\s*mycie|ilk\s*yıka/i,
  /(doba|day|gün)\s*5[-–]?7|revasc|rewask|revaskül/i,
  /(doba|day|gün)\s*6/i,
  /(doba|day|gün)\s*7|week\s*1|tydz/i,
  /(doba|day|gün)\s*8[-–]?10|massage|masaż|masaj|scab|strup|kabuk/i,
  /(doba|day|gün)\s*9/i,
  /(doba|day|gün)\s*10|donor|dawcz/i,
  /(doba|day|gün)\s*11[-–]?14|return\s*to|powrót|dön(?:üş)?/i,
  /(doba|day|gün)\s*12/i,
  /(doba|day|gün)\s*13|checkup|kontrol/i,
  /(doba|day|gün)\s*14|shock\s*loss/i,
];
