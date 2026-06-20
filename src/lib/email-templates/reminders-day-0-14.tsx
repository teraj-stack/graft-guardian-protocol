import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { SCHEDULE, addDaysIso } from "@/lib/schedule-data";

interface Props {
  surgeryDate?: string;
}

const RemindersDay0To14 = ({ surgeryDate }: Props) => {
  const date = surgeryDate ?? new Date().toISOString().slice(0, 10);
  return (
    <Html lang="pl" dir="ltr">
      <Head />
      <Preview>Twoje przypomnienia po przeszczepie — Dzień 0–14</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Graftgen.com</Heading>
          <Text style={lead}>
            Pełny protokół przypomnień na pierwsze 14 dni po przeszczepie włosów.
            Data zabiegu: <strong>{date}</strong>.
          </Text>
          <Text style={lead}>
            Każdy dzień ma listę zadań — wykonuj krok po kroku. Wiadomość ma
            charakter edukacyjny i nie zastępuje zaleceń lekarza prowadzącego.
          </Text>
          <Hr style={hr} />
          {SCHEDULE.map((d) => (
            <Section key={d.day} style={daySection}>
              <Heading as="h2" style={h2}>
                Dzień {d.day} — {addDaysIso(date, d.day)}
              </Heading>
              <Text style={phase}>{d.phase} • {d.focus}</Text>
              {d.tasks.map((t) => (
                <Text key={t.id} style={t.tone === "critical" ? taskCritical : task}>
                  • {t.label}
                  {t.tone === "critical" ? " — KRYTYCZNE" : ""}
                </Text>
              ))}
            </Section>
          ))}
          <Hr style={hr} />
          <Text style={meta}>
            Pełna interaktywna checklista i kalkulator dat:{" "}
            https://graftgen.com/#harmonogram
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: RemindersDay0To14,
  subject: "Graftgen.com — Twoje przypomnienia Dzień 0–14",
  displayName: "Przypomnienia Dzień 0–14",
  previewData: { surgeryDate: new Date().toISOString().slice(0, 10) },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container = { padding: "32px 28px", maxWidth: "640px" };
const h1 = { fontSize: "22px", color: "#0c121b", margin: "0 0 16px" };
const h2 = { fontSize: "16px", color: "#0c121b", margin: "0 0 6px" };
const lead = { fontSize: "14px", lineHeight: "1.6", color: "#1f2937", margin: "0 0 12px" };
const phase = { fontSize: "12px", color: "#6b7280", margin: "0 0 8px", textTransform: "uppercase" as const, letterSpacing: "0.05em" };
const task = { fontSize: "13px", lineHeight: "1.5", color: "#1f2937", margin: "2px 0" };
const taskCritical = { ...task, color: "#b91c1c", fontWeight: 600 };
const daySection = { padding: "10px 0", borderBottom: "1px solid #e5e7eb" };
const hr = { borderColor: "#e5e7eb", margin: "20px 0" };
const meta = { fontSize: "12px", color: "#6b7280", marginTop: "16px" };
