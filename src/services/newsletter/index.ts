/**
 * Newsletter Services Index
 *
 * Exports all newsletter-related services and types.
 */

export {
  NewsletterGeneratorService,
  newsletterGenerator,
  type Article,
  type Event,
  type Resource,
  type Proposal,
  type Achievement,
  type Campaign,
  type WeeklyNewsletter,
  type MonthlyNewsletter,
} from './NewsletterGenerator';

export {
  generateWeeklyNewsletterHTML,
  generateMonthlyNewsletterHTML,
  generateNewsletterHTML,
} from './NewsletterTemplates';
