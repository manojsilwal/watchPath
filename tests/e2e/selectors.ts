import type { Page } from '@playwright/test';

export const Selectors = {
  home: {
    searchInput: (page: Page) => page.getByPlaceholder(/search for a movie or show/i),
    /** Radix Select trigger */
    countryTrigger: (page: Page) => page.getByRole('combobox'),
    /** Opens trigger then picks option whose visible label matches code (e.g. GB → 🇬🇧 UK) */
    async selectCountry(page: Page, countryCode: string) {
      await page.getByRole('combobox').click();
      const labels: Record<string, RegExp> = {
        US: /🇺🇸\s*US|US/,
        GB: /🇬🇧\s*UK|UK/,
        CA: /🇨🇦\s*CA|CA/,
        AU: /🇦🇺\s*AU|AU/,
        IN: /🇮🇳\s*IN|IN/,
      };
      await page.getByRole('option', { name: labels[countryCode] ?? new RegExp(countryCode) }).click();
    },
    searchButton: (page: Page) => page.getByRole('button', { name: /^search$/i }),
  },
  search: {
    backLink: (page: Page) => page.getByRole('link', { name: /back to home/i }),
    titleCard: (page: Page) => page.locator('a[href^="/title/"]'),
    noResultsText: (page: Page) => page.getByText(/no results found/i),
  },
  titleDetail: {
    backButton: (page: Page) => page.getByRole('button', { name: /^back$/i }),
    bestOptionHeading: (page: Page) => page.getByText(/best option for you/i),
    freeTrialBadge: (page: Page) => page.getByText(/free trial available/i),
  },
  general: {
    loadingText: (page: Page) => page.getByText(/loading/i),
  },
};
