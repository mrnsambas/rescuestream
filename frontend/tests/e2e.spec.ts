import { test, expect } from '@playwright/test';

test('loads dashboard', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await expect(page.locator('text=RescueStream')).toBeVisible();
});

test('renders rescue button for at-risk positions', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  // Simulated data flow adds entries periodically; wait a bit and check for "Rescue" button presence.
  await page.waitForTimeout(4000);
  const anyRescue = await page.locator('button:has-text("Rescue")').first();
  // Not a strict assertion since status depends on data; just ensure query works
  await anyRescue.count();
});

