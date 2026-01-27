/**
 * Newsletter Generator Hook
 *
 * Provides React integration for the NewsletterGenerator service.
 * Handles generation, HTML template creation, and state management.
 */

import { useState, useCallback } from 'react';
import {
  newsletterGenerator,
  type WeeklyNewsletter,
  type MonthlyNewsletter,
} from '@/services/newsletter';
import {
  generateWeeklyNewsletterHTML,
  generateMonthlyNewsletterHTML,
} from '@/services/newsletter';

export interface GeneratedNewsletter {
  type: 'weekly' | 'monthly';
  structure: WeeklyNewsletter | MonthlyNewsletter;
  htmlContent: string;
  title: string;
  preheaderText: string;
  generatedAt: Date;
}

interface UseNewsletterGeneratorReturn {
  isGenerating: boolean;
  error: string | null;
  lastGenerated: GeneratedNewsletter | null;
  generateWeekly: (options?: GenerateOptions) => Promise<GeneratedNewsletter | null>;
  generateMonthly: (options?: GenerateOptions) => Promise<GeneratedNewsletter | null>;
  generate: (type: 'weekly' | 'monthly', options?: GenerateOptions) => Promise<GeneratedNewsletter | null>;
  clearError: () => void;
  clearGenerated: () => void;
}

interface GenerateOptions {
  editorNote?: string;
  editorName?: string;
  editorAvatarUrl?: string;
  customTitle?: string;
  customPreheader?: string;
}

export function useNewsletterGenerator(): UseNewsletterGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<GeneratedNewsletter | null>(null);

  const generateWeekly = useCallback(async (options?: GenerateOptions): Promise<GeneratedNewsletter | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Generate newsletter structure
      const structure = await newsletterGenerator.generateWeeklyNewsletter();

      // Generate title
      const now = new Date();
      const title = options?.customTitle ||
        `BLKOUT Weekly - ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;

      // Generate preheader
      const preheaderText = options?.customPreheader ||
        `Your weekly dose of Black queer joy and community updates - ${structure.upcomingEvents.length} events, ${structure.highlights.length} stories`;

      // Generate HTML
      const htmlContent = generateWeeklyNewsletterHTML(structure, {
        title,
        preheaderText,
        editorNote: options?.editorNote,
        editorName: options?.editorName || 'Rob',
        editorAvatarUrl: options?.editorAvatarUrl,
      });

      const generated: GeneratedNewsletter = {
        type: 'weekly',
        structure,
        htmlContent,
        title,
        preheaderText,
        generatedAt: new Date(),
      };

      setLastGenerated(generated);
      return generated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate weekly newsletter';
      setError(errorMessage);
      console.error('[useNewsletterGenerator] Weekly generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateMonthly = useCallback(async (options?: GenerateOptions): Promise<GeneratedNewsletter | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Generate newsletter structure
      const structure = await newsletterGenerator.generateMonthlyNewsletter();

      // Generate title
      const now = new Date();
      const title = options?.customTitle ||
        `BLKOUT Monthly - ${now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;

      // Generate preheader
      const preheaderText = options?.customPreheader ||
        `Your monthly community roundup from BLKOUT - highlights, events, and what's coming next`;

      // Generate HTML
      const htmlContent = generateMonthlyNewsletterHTML(structure, {
        title,
        preheaderText,
        editorNote: options?.editorNote,
        editorName: options?.editorName || 'Rob',
        editorAvatarUrl: options?.editorAvatarUrl,
      });

      const generated: GeneratedNewsletter = {
        type: 'monthly',
        structure,
        htmlContent,
        title,
        preheaderText,
        generatedAt: new Date(),
      };

      setLastGenerated(generated);
      return generated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate monthly newsletter';
      setError(errorMessage);
      console.error('[useNewsletterGenerator] Monthly generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generate = useCallback(async (
    type: 'weekly' | 'monthly',
    options?: GenerateOptions
  ): Promise<GeneratedNewsletter | null> => {
    if (type === 'weekly') {
      return generateWeekly(options);
    }
    return generateMonthly(options);
  }, [generateWeekly, generateMonthly]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearGenerated = useCallback(() => {
    setLastGenerated(null);
  }, []);

  return {
    isGenerating,
    error,
    lastGenerated,
    generateWeekly,
    generateMonthly,
    generate,
    clearError,
    clearGenerated,
  };
}

/**
 * Utility function to extract plain text from HTML
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Utility function to estimate email size
 */
export function estimateEmailSize(html: string): { kb: number; isUnderLimit: boolean } {
  const blob = new Blob([html], { type: 'text/html' });
  const kb = Math.ceil(blob.size / 1024);
  return {
    kb,
    isUnderLimit: kb < 102, // SendFox limit is ~102KB
  };
}

export default useNewsletterGenerator;
