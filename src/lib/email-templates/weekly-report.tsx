// Szablon e-maila: cotygodniowy raport PDF dla pacjenta po DHI.
// Branding spójny z kliniką (paleta navy + champagne, Cormorant Garamond / Inter).
// Treść w języku polskim, ton kliniczny, bez marketingu.
//
// Personalizacja:
//   - patientFirstName: imię pacjenta (vocative)
//   - weekNumber: numer tygodnia po zabiegu (1–12)
//   - reportDate: data wygenerowania raportu (ISO -> wyświetlana po polsku)
//   - pdfUrl: bezpośredni link do PDF (signed URL, 7 dni)
//   - acceptUrl: link do potwierdzenia odbioru (one-click, token jednorazowy)
//   - coordinatorName: imię i nazwisko koordynatora podpisującego raport
//   - nextSessionDate (opcjonalnie): data najbliższej sesji
//
// System załącza stopkę unsubscribe automatycznie — nie dodajemy jej tutaj.

import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import {
  COMPANY_NAME_SHORT,
  COMPANY_ADDRESS,
} from "@/lib/company";
import { REPORT_TEMPLATE_VERSION } from "@/lib/report-template";

export interface WeeklyReportEmailProps {
  patientFirstName: string;
  weekNumber: number;
  reportDate: string; // ISO 8601
  pdfUrl: string;
  acceptUrl: string;
  coordinatorName: string;
  nextSessionDate?: string; // ISO 8601
  logoUrl?: string;
}

const formatPL = (iso: string) =>
  new Date(iso).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export const WeeklyReportEmail: React.FC<WeeklyReportEmailProps> = ({
  patientFirstName,
  weekNumber,
  reportDate,
  pdfUrl,
  acceptUrl,
  coordinatorName,
  nextSessionDate,
  logoUrl = "https://graftgen.com/logo-email.png",
}) => {
  const preview = `Raport tygodnia ${weekNumber} po DHI — gotowy do wglądu`;

  return (
    <Html lang="pl" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header z logo */}
          <Section style={headerSection}>
            <Img
              src={logoUrl}
              width="140"
              height="36"
              alt="Graftgen.com"
              style={{ display: "block" }}
            />
          </Section>

          <Hr style={hrGold} />

          {/* Tytuł */}
          <Section style={{ padding: "8px 0 0 0" }}>
            <Text style={eyebrow}>
              TYDZIEŃ {weekNumber} · {formatPL(reportDate).toUpperCase()}
            </Text>
            <Heading as="h1" style={h1}>
              Raport pooperacyjny gotowy
            </Heading>
          </Section>

          {/* Powitanie */}
          <Section>
            <Text style={paragraph}>
              {patientFirstName
                ? `Witamy, ${patientFirstName}.`
                : "Dzień dobry."}
            </Text>
            <Text style={paragraph}>
              Załączony raport podsumowuje <strong>tydzień {weekNumber}</strong>{" "}
              Twojego protokołu po przeszczepie metodą DHI. Zawiera parametry
              biometryczne (faza anagenu, grubość włosa, gęstość graftów),
              ocenę tolerancji skóry oraz interpretację kliniczną przygotowaną
              przez koordynatora medycznego.
            </Text>
          </Section>

          {/* CTA: PDF */}
          <Section style={ctaWrap}>
            <Link href={pdfUrl} style={ctaPrimary}>
              Pobierz raport (PDF)
            </Link>
            <Text style={ctaHint}>
              Link aktywny przez 7 dni. Plik zaszyfrowany, dostępny tylko dla
              Ciebie.
            </Text>
          </Section>

          {/* CTA: Akceptacja */}
          <Section style={acceptBox}>
            <Text style={acceptLabel}>POTWIERDZENIE ODBIORU</Text>
            <Text style={paragraph}>
              Prosimy o jedno kliknięcie, aby potwierdzić, że zapoznałeś/aś się
              z raportem. To pozwala nam upewnić się, że treść kliniczna do
              Ciebie dotarła.
            </Text>
            <Link href={acceptUrl} style={ctaSecondary}>
              Potwierdzam odbiór raportu
            </Link>
          </Section>

          {nextSessionDate && (
            <Section style={{ padding: "8px 0" }}>
              <Text style={paragraph}>
                <strong>Najbliższa sesja:</strong> {formatPL(nextSessionDate)}.
                Szczegóły logistyczne otrzymasz osobnym przypomnieniem na 24 h
                przed wizytą.
              </Text>
            </Section>
          )}

          <Hr style={hrSubtle} />

          {/* Podpis */}
          <Section>
            <Text style={signatureScript}>{coordinatorName}</Text>
            <Text style={signatureMeta}>
              Koordynator medyczny · {COMPANY_NAME_SHORT}
            </Text>
          </Section>

          <Hr style={hrSubtle} />

          {/* Footer */}
          <Section>
            <Text style={footerText}>
              {COMPANY_NAME_SHORT} · {COMPANY_ADDRESS}
            </Text>
            <Text style={footerMeta}>
              Szablon raportu v{REPORT_TEMPLATE_VERSION} · E-mail wygenerowany
              automatycznie po zakończeniu cyklu tygodniowego. W razie pytań
              klinicznych odpowiedz na tę wiadomość — trafi do koordynatora.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// ===== Branding kliniki (inline styles wymagane przez klienty pocztowe) =====

const NAVY = "#0c121b";
const NAVY_SOFT = "#1a2433";
const GOLD = "#c9a96a";
const GOLD_SOFT = "#e6d4a8";
const INK = "#1a1a1a";
const MUTED = "#5b6473";
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const main = {
  backgroundColor: "#ffffff",
  fontFamily: SANS,
  color: INK,
  margin: 0,
  padding: 0,
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "32px 28px",
};

const headerSection = { padding: "0 0 16px 0" };

const hrGold = {
  border: "none",
  borderTop: `2px solid ${GOLD}`,
  margin: "0 0 12px 0",
};

const hrSubtle = {
  border: "none",
  borderTop: `1px solid #e9ecf1`,
  margin: "24px 0 16px 0",
};

const eyebrow = {
  fontFamily: SANS,
  fontSize: "11px",
  letterSpacing: "0.18em",
  color: GOLD,
  margin: "0 0 8px 0",
  fontWeight: 600,
};

const h1 = {
  fontFamily: SERIF,
  fontSize: "30px",
  lineHeight: "36px",
  fontWeight: 500,
  color: NAVY,
  margin: "0 0 16px 0",
  letterSpacing: "-0.01em",
};

const paragraph = {
  fontFamily: SANS,
  fontSize: "15px",
  lineHeight: "24px",
  color: INK,
  margin: "0 0 14px 0",
};

const ctaWrap = { padding: "8px 0 4px 0" };

const ctaPrimary = {
  display: "inline-block",
  backgroundColor: NAVY,
  color: "#ffffff",
  textDecoration: "none",
  padding: "14px 28px",
  fontFamily: SANS,
  fontSize: "14px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  borderRadius: "2px",
  border: `1px solid ${NAVY}`,
};

const ctaHint = {
  fontFamily: SANS,
  fontSize: "12px",
  color: MUTED,
  margin: "10px 0 0 0",
};

const acceptBox = {
  backgroundColor: "#faf7f0",
  border: `1px solid ${GOLD_SOFT}`,
  padding: "20px 22px",
  margin: "20px 0",
  borderRadius: "2px",
};

const acceptLabel = {
  fontFamily: SANS,
  fontSize: "10px",
  letterSpacing: "0.2em",
  color: NAVY_SOFT,
  margin: "0 0 8px 0",
  fontWeight: 700,
};

const ctaSecondary = {
  display: "inline-block",
  backgroundColor: "#ffffff",
  color: NAVY,
  textDecoration: "none",
  padding: "12px 24px",
  fontFamily: SANS,
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  borderRadius: "2px",
  border: `1.5px solid ${NAVY}`,
};

const signatureScript = {
  fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
  fontSize: "26px",
  color: NAVY,
  margin: "0 0 4px 0",
};

const signatureMeta = {
  fontFamily: SANS,
  fontSize: "12px",
  color: MUTED,
  margin: 0,
};

const footerText = {
  fontFamily: SANS,
  fontSize: "12px",
  color: MUTED,
  margin: "0 0 6px 0",
};

const footerMeta = {
  fontFamily: SANS,
  fontSize: "11px",
  lineHeight: "16px",
  color: MUTED,
  margin: 0,
};

// ===== Wersja tekstowa (fallback dla klientów bez HTML) =====

export function renderWeeklyReportText(p: WeeklyReportEmailProps): string {
  return [
    `Tydzień ${p.weekNumber} · ${formatPL(p.reportDate)}`,
    `Raport pooperacyjny gotowy`,
    ``,
    p.patientFirstName ? `Witamy, ${p.patientFirstName}.` : `Dzień dobry.`,
    ``,
    `Załączony raport podsumowuje tydzień ${p.weekNumber} Twojego protokołu po przeszczepie metodą DHI: parametry biometryczne (anagen, grubość włosa, gęstość graftów), tolerancję skóry oraz interpretację kliniczną.`,
    ``,
    `Pobierz raport (PDF, link aktywny 7 dni):`,
    p.pdfUrl,
    ``,
    `Potwierdź odbiór raportu (jedno kliknięcie):`,
    p.acceptUrl,
    ``,
    p.nextSessionDate
      ? `Najbliższa sesja: ${formatPL(p.nextSessionDate)}.`
      : ``,
    ``,
    `${p.coordinatorName}`,
    `Koordynator medyczny · ${COMPANY_NAME_SHORT}`,
    ``,
    `${COMPANY_NAME_SHORT} · ${COMPANY_ADDRESS}`,
    `Szablon raportu v${REPORT_TEMPLATE_VERSION}`,
  ]
    .filter(Boolean)
    .join("\n");
}

// Rejestracyjny eksport zgodny z konwencją Lovable Emails (gdy infra będzie aktywna).
export const template = {
  component: WeeklyReportEmail,
  subject: (data: WeeklyReportEmailProps) =>
    `Raport tygodnia ${data.weekNumber} po DHI — gotowy do wglądu`,
  displayName: "Cotygodniowy raport PDF",
  previewData: {
    patientFirstName: "Marek",
    weekNumber: 3,
    reportDate: "2026-06-19",
    pdfUrl: "https://graftgen.com/raporty/przyklad.pdf",
    acceptUrl: "https://graftgen.com/raporty/akceptacja?t=demo",
    coordinatorName: "dr n. med. Anna Kowalska-Bujok",
    nextSessionDate: "2026-06-22",
  } satisfies WeeklyReportEmailProps,
};

export default WeeklyReportEmail;
