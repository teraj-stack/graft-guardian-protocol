import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  sentAt?: string;
}

const TestPing = ({ sentAt }: Props) => (
  <Html lang="pl" dir="ltr">
    <Head />
    <Preview>Graftgen.com — test infrastruktury e-mail</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Graftgen.com</Heading>
        <Text style={text}>
          To wiadomość testowa potwierdzająca, że infrastruktura e-mail
          z domeny <strong>notify.graftgen.com</strong> działa end-to-end.
        </Text>
        <Text style={meta}>
          Wysłano: {sentAt ?? new Date().toISOString()}
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: TestPing,
  subject: "Graftgen.com — test wysyłki",
  displayName: "Test ping",
  previewData: { sentAt: new Date().toISOString() },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container = { padding: "32px 28px", maxWidth: "560px" };
const h1 = { fontSize: "22px", color: "#0c121b", margin: "0 0 16px" };
const text = { fontSize: "15px", lineHeight: "1.6", color: "#1f2937" };
const meta = { fontSize: "12px", color: "#6b7280", marginTop: "24px" };
