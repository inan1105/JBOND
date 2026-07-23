import { test, expect } from '@playwright/test';

test.describe('시가평가표 Sticky (360/390/430)', () => {
  test('헤더·첫열이 sticky 로 고정된다', async ({ page }) => {
    await page.goto('/mtm');
    await expect(page.getByTestId('mtm-grid')).toBeVisible();

    const cornerPos = await page
      .locator('.mtm-corner')
      .evaluate((el) => getComputedStyle(el).position);
    const colHeadPos = await page
      .locator('.mtm-col-head')
      .first()
      .evaluate((el) => getComputedStyle(el).position);
    const rowHeadPos = await page
      .locator('.mtm-row-head')
      .first()
      .evaluate((el) => getComputedStyle(el).position);

    expect(cornerPos).toBe('sticky');
    expect(colHeadPos).toBe('sticky');
    expect(rowHeadPos).toBe('sticky');
  });

  test('가로 스크롤 후에도 첫열 라벨이 화면 안에 남는다', async ({ page }) => {
    await page.goto('/mtm');
    const grid = page.getByTestId('mtm-grid');
    await grid.evaluate((el) => el.scrollTo({ left: 300 }));
    const rowHead = page.locator('.mtm-row-head').first();
    const box = await rowHead.boundingBox();
    expect(box).not.toBeNull();
    // 첫 열은 좌측(0 근처)에 고정되어 있어야 한다
    expect(box!.x).toBeLessThan(60);
  });

  test('결측 셀은 —로 표시된다', async ({ page }) => {
    await page.goto('/mtm');
    await expect(page.locator('[data-testid="mtm-grid"]').getByText('—').first()).toBeVisible();
  });
});
