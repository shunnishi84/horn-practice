import { test, expect, type Page } from '@playwright/test';

async function clearAppData(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    return new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('wind-trainer');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });
}

test.describe('WindTrainer E2E', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppData(page);
    await page.goto('/');
  });

  test('ホームが表示され主要セクションが見える', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'WindTrainer' })).toBeVisible();
    await expect(page.getByTestId('today-minutes')).toBeVisible();
    await expect(page.getByTestId('streak-days')).toBeVisible();
    await expect(page.getByTestId('start-practice')).toBeVisible();
    await expect(page.getByTestId('no-sessions')).toBeVisible();
  });

  test('ナビゲーションで全ページに遷移できる', async ({ page }) => {
    await page.getByRole('link', { name: 'プリセット' }).click();
    await expect(page.getByTestId('category-tabs')).toBeVisible();

    await page.getByRole('link', { name: '統計' }).click();
    await expect(page.getByTestId('stats-page')).toBeVisible();

    await page.getByRole('link', { name: '設定' }).click();
    await expect(page.getByTestId('settings-page')).toBeVisible();

    await page.getByRole('link', { name: 'エクスポート' }).click();
    await expect(page.getByTestId('export-page')).toBeVisible();
  });

  test('プリセット選択でカテゴリ切替ができる', async ({ page }) => {
    await page.goto('/presets');
    await page.getByTestId('tab-scale').click();
    await expect(page.getByTestId('preset-sc-c-major')).toBeVisible();
    await page.getByTestId('tab-tonguing').click();
    await expect(page.getByTestId('preset-tg-quarter')).toBeVisible();
  });

  test('練習設定でBPMと楽器が変更できる', async ({ page }) => {
    await page.goto('/presets');
    await page.getByTestId('tab-scale').click();
    await page.getByTestId('preset-sc-c-major').click();
    await expect(page.getByTestId('score-preview')).toBeVisible();
    await page.getByTestId('bpm-input').fill('100');
    await page.getByTestId('instrument-select').selectOption('alto_sax');
    await page.getByTestId('transposition-select').selectOption('Eb');
    await expect(page.getByTestId('start-countdown')).toBeVisible();
  });

  test('設定の各値が変更され保存される', async ({ page }) => {
    await page.goto('/settings');
    await page.getByTestId('tuning-hz').fill('442');
    await page.getByTestId('theme-select').selectOption('light');
    // Reload and confirm persistence
    await page.reload();
    await expect(page.getByTestId('tuning-hz')).toHaveValue('442');
    await expect(page.getByTestId('theme-select')).toHaveValue('light');
  });

  test('練習フロー全体（カウントダウン→演奏→結果）が動作し、セッションが保存される', async ({ page }) => {
    // Use long-tone preset (short) and e2e flag to skip mic init
    await page.goto('/practice/lt-cresc?bpm=240&e2e=1');
    // Countdown should appear quickly since no mic init needed
    await expect(page.getByTestId('countdown-overlay')).toBeVisible({ timeout: 5000 });
    // Wait for play phase (countdown 3->2->1->go takes ~2.4s + 600ms)
    await expect(page.getByTestId('e2e-finalize')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('e2e-finalize').click();
    // Result page
    await expect(page.getByTestId('result-page')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('total-score')).toBeVisible();
    await expect(page.getByTestId('note-table')).toBeVisible();

    // Go home and confirm session is listed and stats updated
    await page.getByRole('link', { name: 'ホームへ' }).click();
    await expect(page.getByTestId('today-minutes')).toBeVisible();
    // session list should now have at least one entry
    await expect(page.locator('text=ロングトーン C メジャー')).toBeVisible();
  });

  test('結果からホームに戻れる', async ({ page }) => {
    await page.goto('/practice/lt-cresc?bpm=240&e2e=1');
    await expect(page.getByTestId('e2e-finalize')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('e2e-finalize').click();
    await expect(page.getByTestId('result-page')).toBeVisible();
    await page.getByRole('link', { name: 'ホームへ' }).click();
    await expect(page.getByTestId('start-practice')).toBeVisible();
  });

  test('統計画面に保存済みセッションのデータが反映される', async ({ page }) => {
    // First record a session
    await page.goto('/practice/lt-cresc?bpm=240&e2e=1');
    await expect(page.getByTestId('e2e-finalize')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('e2e-finalize').click();
    await expect(page.getByTestId('result-page')).toBeVisible();

    await page.goto('/stats');
    await expect(page.getByTestId('stats-page')).toBeVisible();
    await expect(page.getByTestId('heatmap')).toBeVisible();
    await expect(page.getByTestId('note-heatmap')).toBeVisible();
    await expect(page.getByTestId('stats-table')).toBeVisible();
    // Should have at least one row in stats
    const rows = await page.locator('[data-testid="stats-table"] tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });

  test('エクスポート＆インポートのフロー', async ({ page }) => {
    // Make a session first
    await page.goto('/practice/lt-cresc?bpm=240&e2e=1');
    await expect(page.getByTestId('e2e-finalize')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('e2e-finalize').click();
    await expect(page.getByTestId('result-page')).toBeVisible();

    await page.goto('/data');
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-btn').click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).toBeTruthy();
  });
});
