import { test, expect } from '@playwright/test';
import { waitForGameBoot } from '../helpers/game-fixtures';

test.describe('Grade UI (TS module)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameBoot(page);
  });

  test('normalizeL2GradeSlug maps grades to slugs', async ({ page }) => {
    const slugs = await page.evaluate(() => ({
      ng: window.normalizeL2GradeSlug('NO-GRADE'),
      s: window.normalizeL2GradeSlug('S'),
      fallback: window.normalizeL2GradeSlug('unknown'),
    }));
    expect(slugs.ng).toBe('ng');
    expect(slugs.s).toBe('s');
    expect(slugs.fallback).toBe('ng');
  });

  test('getGradeUi returns hex color and css tokens', async ({ page }) => {
    const ui = await page.evaluate(() => window.getGradeUi('A'));
    expect(ui.slug).toBe('a');
    expect(ui.color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(ui.cssColor).toContain('--l2-grade-a-color');
  });

  test('buildGradeTagHtml includes grade class', async ({ page }) => {
    const html = await page.evaluate(() => window.buildGradeTagHtml('B', 'B-Grade'));
    expect(html).toContain('l2-grade-tag--b');
    expect(html).toContain('[B-Grade]');
  });
});
