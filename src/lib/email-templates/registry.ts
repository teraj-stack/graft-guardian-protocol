import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
import { template as testPingTemplate } from './test-ping'
import { template as remindersDay0To14Template } from './reminders-day-0-14'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'test-ping': testPingTemplate,
  'reminders-day-0-14': remindersDay0To14Template,
}
