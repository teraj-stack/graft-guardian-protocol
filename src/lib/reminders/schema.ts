import { z } from "zod";

export const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const subscribeSchema = z
  .object({
    email: z.string().trim().toLowerCase().regex(EMAIL_REGEX, "Nieprawidłowy e-mail").max(254),
    phone: z
      .string()
      .trim()
      .regex(PHONE_REGEX, "Telefon w formacie +48xxxxxxxxx")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    surgeryDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Wymagana data w formacie RRRR-MM-DD"),
    channelEmail: z.boolean(),
    channelSms: z.boolean(),
    selectedWeeks: z
      .array(z.number().int().min(1).max(12))
      .min(1, "Wybierz co najmniej jeden tydzień")
      .max(12),
    consent: z.literal(true, {
      errorMap: () => ({ message: "Wymagana zgoda na otrzymywanie wiadomości" }),
    }),
  })
  .refine((d) => d.channelEmail || d.channelSms, {
    message: "Wybierz co najmniej jeden kanał",
    path: ["channelEmail"],
  })
  .refine((d) => !d.channelSms || !!d.phone, {
    message: "SMS wymaga numeru telefonu",
    path: ["phone"],
  });

export type SubscribeInput = z.infer<typeof subscribeSchema>;
