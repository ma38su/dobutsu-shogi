import { expect, test, type Page } from '@playwright/test'

function captureRuntimeErrors(page: Page) {
  const errors: string[] = []

  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', error => errors.push(`page: ${error.message}`))
  page.on('requestfailed', request => {
    errors.push(`request: ${request.url()} (${request.failure()?.errorText ?? 'failed'})`)
  })

  return errors
}

async function expectImagesLoaded(page: Page, selector: string) {
  await expect(page.locator(selector).first()).toBeVisible()
  await expect.poll(() => page.locator(selector).evaluateAll(images =>
    images.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0),
  )).toBe(true)
}

test('ランチャーから両方のゲームを開ける', async ({ page }) => {
  const errors = captureRuntimeErrors(page)

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'どちらであそぶ？' })).toBeVisible()
  await expect(page.getByRole('link', { name: /おかししょうぎ/ })).toHaveAttribute('href', /\/okashi\/$/)
  await expect(page.getByRole('link', { name: /さむらいしょうぎ/ })).toHaveAttribute('href', /\/samurai\/$/)
  await expectImagesLoaded(page, '.choice-art img')
  expect(errors).toEqual([])
})

for (const game of [
  { path: 'okashi', title: 'おかししょうぎ', chick: 'クッキー', lion: 'パフェ' },
  { path: 'samurai', title: 'さむらいしょうぎ', chick: '足軽', lion: '大将' },
]) {
  test(`${game.title}を表示し、先手と後手が基本の一手を指せる`, async ({ page }) => {
    const errors = captureRuntimeErrors(page)

    await page.goto(`/${game.path}/`)
    await expect(page.getByRole('heading', { name: game.title })).toBeVisible()
    await page.getByRole('button', { name: /対局する/ }).click()

    const boardSquares = page.locator('.game-card .board > button')
    await expect(boardSquares).toHaveCount(12)
    await expectImagesLoaded(page, '.piece-icon')

    // AIの待ち時間やランダム性を避け、両陣営の操作を直接確認する。
    await page.getByLabel('後手の担当').selectOption('human')

    await page.getByRole('button', { name: `2三${game.chick}`, exact: true }).click()
    await expect(page.getByRole('button', { name: `2二${game.chick}`, exact: true })).toHaveClass(/target/)
    await page.getByRole('button', { name: `2二${game.chick}`, exact: true }).click()
    await expect(page.locator('.timeline')).toContainText('1 / 1 手')

    await page.getByRole('button', { name: `2一${game.lion}`, exact: true }).click()
    await expect(page.getByRole('button', { name: `2二${game.chick}`, exact: true })).toHaveClass(/target/)
    await page.getByRole('button', { name: `2二${game.chick}`, exact: true }).click()
    await expect(page.locator('.timeline')).toContainText('2 / 2 手')
    await expect(page.getByRole('button', { name: `2二${game.lion}`, exact: true })).toBeVisible()

    expect(errors).toEqual([])
  })
}
