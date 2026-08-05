import { expect, test, type Page } from '@playwright/test'

function captureRuntimeErrors(page: Page) {
  const errors: string[] = []

  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', error => errors.push(`page: ${error.message}`))
  page.on('requestfailed', request => {
    const failure=request.failure()?.errorText??'failed'
    if(failure==='net::ERR_ABORTED')return
    errors.push(`request: ${request.url()} (${failure})`)
  })

  return errors
}

async function expectImagesLoaded(page: Page, selector: string) {
  await expect(page.locator(selector).first()).toBeVisible()
  await expect.poll(() => page.locator(selector).evaluateAll(images =>
    images.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0),
  )).toBe(true)
}

async function expectPageFitsViewport(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollHeight <= document.documentElement.clientHeight + 1,
  )).toBe(true)
}

async function expectElementsFitViewport(page: Page, selectors: string[]) {
  await expect.poll(() => page.evaluate(items => items.every(selector => {
    const element = document.querySelector(selector)
    if (!element) return false
    const rect = element.getBoundingClientRect()
    return rect.top >= -1
      && rect.left >= -1
      && rect.bottom <= window.innerHeight + 1
      && rect.right <= window.innerWidth + 1
  }), selectors)).toBe(true)
}

test('ランチャーから両方のゲームを開ける', async ({ page }) => {
  const errors = captureRuntimeErrors(page)

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'どちらであそぶ？' })).toBeVisible()
  await expect(page.getByRole('link', { name: /おかししょうぎ/ })).toHaveAttribute('href', /\/okashi\/$/)
  await expect(page.getByRole('link', { name: /さむらいしょうぎ/ })).toHaveAttribute('href', /\/samurai\/$/)
  await expect(page.locator('.okashi-choice .choice-art img').nth(0)).toHaveAttribute('src', /\/pieces\/sweets\/wagashi\/lion\.png/)
  await expect(page.locator('.okashi-choice .choice-art img').nth(1)).toHaveAttribute('src', /\/pieces\/sweets\/wagashi\/chick\.png/)
  await expectImagesLoaded(page, '.choice-art img')
  expect(errors).toEqual([])
})

test('AIが先手の着手に応手する', async ({ page }) => {
  const errors = captureRuntimeErrors(page)

  await page.goto('/okashi/')
  await page.getByRole('button', { name: /対局する/ }).click()
  await expect(page.locator('.turn-badge')).toContainText('先手の番')
  await expect(page.locator('.turn-badge')).toContainText('駒を選んでください')

  await page.getByRole('button', { name: '2三こんぺいとう', exact: true }).click()
  const aiTurnStarted=Date.now()
  await page.getByRole('button', { name: '2二こんぺいとう', exact: true }).click()

  await expect(page.locator('.timeline')).toContainText('2 / 2 手', { timeout: 10_000 })
  expect(Date.now()-aiTurnStarted).toBeGreaterThanOrEqual(300)
  await expect(page.getByText('● 手番です')).toBeVisible()
  expect(errors).toEqual([])
})

test('おかしの種類を切り替えると対局と詰将棋の駒・名前が揃って変わる', async ({ page }) => {
  const errors = captureRuntimeErrors(page)

  await page.goto('/okashi/')
  await page.getByRole('button', { name: /対局する/ }).click()

  const battlePieceSet = page.locator('.setting').filter({ hasText: 'おかしの種類' }).locator('select')
  await expect(battlePieceSet).toHaveValue('wagashi')
  await expect(page.getByRole('button', { name: '2四あんみつ', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '2四あんみつ', exact: true }).locator('img')).toHaveAttribute('src', /\/wagashi\/lion\.png/)

  await battlePieceSet.selectOption('western')
  await expect(page.getByRole('button', { name: '2四ケーキ', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '2三マカロン', exact: true }).locator('img')).toHaveAttribute('src', /\/western\/chick\.png/)
  await expect(page.locator('.setting').filter({ hasText: '対局モード' })).toContainText('ケーキが取られる手を指すと負けです')

  await battlePieceSet.selectOption('mix')
  await expect(page.getByRole('button', { name: '2四パフェ', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '2三クッキー', exact: true }).locator('img')).toHaveAttribute('src', /\/mix\/chick\.png/)

  await page.getByRole('button', { name: 'モード選択' }).click()
  await page.getByRole('button', { name: /詰将棋に挑戦/ }).click()

  const puzzlePieceSet = page.locator('.puzzle-piece-set select')
  await expect(puzzlePieceSet).toHaveValue('mix')
  await puzzlePieceSet.selectOption('wagashi')
  await expect(page.locator('.puzzle-hero')).toContainText('最後にあんみつの逃げ道をなくそう')
  await expect(page.locator('.puzzle-hero-piece img')).toHaveAttribute('src', /\/wagashi\/lion\.png/)

  await puzzlePieceSet.selectOption('western')
  await expect(page.locator('.puzzle-hero')).toContainText('最後にケーキの逃げ道をなくそう')
  await expect(page.locator('.puzzle-hero-piece img')).toHaveAttribute('src', /\/western\/lion\.png/)

  expect(errors).toEqual([])
})

test('最初の1手詰めをクリアできる', async ({ page }) => {
  const errors = captureRuntimeErrors(page)

  await page.goto('/okashi/')
  await page.getByRole('button', { name: /詰将棋に挑戦/ }).click()
  await page.getByRole('button', { name: /まんなかを ふさごう/ }).click()

  await expect(page.getByText('1手以内に詰ませよう')).toBeVisible()
  await page.getByRole('button', { name: '動かす駒のヒント' }).click()
  await page.getByRole('button', { name: '行き先も見る' }).click()
  await page.locator('button.puzzle-hint-source').click()
  await page.locator('button.puzzle-hint-target').click()

  await expect(page.getByText('詰み！')).toBeVisible()
  await expect(page.getByText('クリア！')).toBeVisible()
  await expect(page.locator('.puzzle-play-shell')).toHaveClass(/puzzle-outcome-clear/)
  await expect(page.locator('.puzzle-outcome-effect.clear')).toBeAttached()
  await expect(page.locator('.puzzle-outcome-effect.clear .party-popper')).toHaveCount(2)
  await expect(page.locator('.puzzle-outcome-effect.clear i')).toHaveCount(28)
  await expect(page.locator('.puzzle-outcome-effect.clear em')).toHaveCount(6)
  await page.getByRole('button', { name: 'つぎの問題へ →' }).click()
  await expect(page.locator('.puzzle-play-header')).toContainText('みぎから おさえよう')
  await expect(page.getByText('1手以内に詰ませよう')).toBeVisible()
  expect(errors).toEqual([])
})

test('1手詰めの不正解後に相手の応手と理由を表示する', async ({ page }) => {
  const errors = captureRuntimeErrors(page)
  await page.setViewportSize({ width: 360, height: 800 })

  await page.goto('/okashi/')
  await page.getByRole('button', { name: /詰将棋に挑戦/ }).click()
  await page.getByRole('button', { name: /まんなかを ふさごう/ }).click()

  await page.getByRole('button', { name: '3二 こんぺいとう', exact: true }).click()
  await page.getByRole('button', { name: '3一 空き', exact: true }).click()

  await expect(page.getByText('不正解', { exact: true })).toBeVisible()
  await expect(page.getByText('不正解：応手があります')).toBeVisible()
  await expect(page.getByText('相手の応手', { exact: true })).toBeVisible()
  await expect(page.locator('.puzzle-guide')).toContainText('王手はかかりましたが')
  await expect(page.locator('.puzzle-guide')).toContainText('王手した駒を取れます')
  await expect(page.locator('.puzzle-play-shell')).toHaveClass(/puzzle-outcome-wrong/)
  await expect(page.locator('.puzzle-outcome-effect.wrong')).toBeAttached()
  await expect(page.locator('.puzzle-wrong-move')).toHaveCount(1)
  await expect(page.locator('.puzzle-reply-source')).toHaveCount(1)
  await expect(page.locator('.puzzle-reply-target')).toHaveCount(1)
  await expectPageFitsViewport(page)
  await expectElementsFitViewport(page, ['.puzzle-game', '.puzzle-guide', '.puzzle-guide-actions'])

  await page.getByRole('button', { name: 'もう一度考える' }).click()
  await expect(page.getByText('1手以内に詰ませよう')).toBeVisible()
  await expect(page.locator('.puzzle-outcome-effect')).toHaveCount(0)
  expect(errors).toEqual([])
})

for (const nonCheckingOpening of [
  {
    plies: 3,
    tab: /3手詰め/,
    puzzle: /ななめの 連続王手/,
    move: ['3一 だんご', '2一 空き'],
  },
  {
    plies: 5,
    tab: /5手詰め/,
    puzzle: /もちごまから 連続王手/,
    move: ['2三 だんご', '1三 さくらもち'],
  },
]) {
  test(`${nonCheckingOpening.plies}手詰めは初手が王手でなければすぐ不正解を表示する`, async ({ page }) => {
    const errors = captureRuntimeErrors(page)

    await page.goto('/okashi/')
    await page.getByRole('button', { name: /詰将棋に挑戦/ }).click()
    await page.getByRole('button', { name: nonCheckingOpening.tab }).click()
    await page.getByRole('button', { name: nonCheckingOpening.puzzle }).click()

    await page.getByRole('button', { name: nonCheckingOpening.move[0], exact: true }).click()
    await page.getByRole('button', { name: nonCheckingOpening.move[1], exact: true }).click()

    await expect(page.getByText('不正解', { exact: true })).toBeVisible()
    await expect(page.getByText('不正解：王手ではありません')).toBeVisible()
    await expect(page.getByText('王手になっていません', { exact: true })).toBeVisible()
    await expect(page.locator('.puzzle-guide')).toContainText('詰将棋の初手は、王手になる手を選びましょう')
    await expect(page.getByText('相手の応手', { exact: true })).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

for (const wrongLine of [
  {
    plies: 3,
    tab: /3手詰め/,
    puzzle: /ぞうで 道をあける/,
    moves: [
      ['3二 花こんぺいとう', '2一 空き'],
      ['1三 さくらもち', '2二 花こんぺいとう'],
    ],
  },
  {
    plies: 5,
    tab: /5手詰め/,
    puzzle: /もちごまから 連続王手/,
    moves: [
      ['だんご。置いたあとはたて・よこに1マス動けます。選ぶと置ける場所を表示します', '3一 空き'],
      ['3一 だんご', '2一 空き'],
      ['3二 こんぺいとう', '3一 空き'],
    ],
  },
]) {
  test(`${wrongLine.plies}手詰めは間違いの手順も最後まで指してから不正解を表示する`, async ({ page }) => {
    const errors = captureRuntimeErrors(page)

    await page.goto('/okashi/')
    await page.getByRole('button', { name: /詰将棋に挑戦/ }).click()
    await page.getByRole('button', { name: wrongLine.tab }).click()
    await page.getByRole('button', { name: wrongLine.puzzle }).click()

    for (const [index, [from, to]] of wrongLine.moves.entries()) {
      await page.getByRole('button', { name: from, exact: true }).click()
      await page.getByRole('button', { name: to, exact: true }).click()
      if (index < wrongLine.moves.length - 1) {
        await expect(page.getByText(`${wrongLine.plies - (index + 1) * 2}手以内に詰ませよう`)).toBeVisible()
        await expect(page.getByText('不正解', { exact: true })).toHaveCount(0)
      }
    }

    await expect(page.getByText('不正解', { exact: true })).toBeVisible()
    await expect(page.getByText('不正解：応手があります')).toBeVisible()
    await expect(page.getByText('相手の応手', { exact: true })).toBeVisible()
    await expect(page.locator('.puzzle-guide')).toContainText('へ逃げられます')
    await expect(page.locator('.puzzle-wrong-move')).toHaveCount(1)
    await expect(page.locator('.puzzle-reply-source')).toHaveCount(1)
    await expect(page.locator('.puzzle-reply-target')).toHaveCount(1)
    expect(errors).toEqual([])
  })
}

test('3手詰めでも自分の王を取られる手はその応手で不正解にする', async ({ page }) => {
  const errors = captureRuntimeErrors(page)

  await page.goto('/okashi/')
  await page.getByRole('button', { name: /詰将棋に挑戦/ }).click()
  await page.getByRole('button', { name: /3手詰め/ }).click()
  await page.getByRole('button', { name: /ななめから まっすぐ/ }).click()

  await page.getByRole('button', { name: '2四 あんみつ', exact: true }).click()
  await page.getByRole('button', { name: '3三 空き', exact: true }).click()

  await expect(page.getByText('不正解', { exact: true })).toBeVisible()
  await expect(page.getByText('相手の応手', { exact: true })).toBeVisible()
  await expect(page.locator('.puzzle-guide')).toContainText('こちらのあんみつを取れます')
  expect(errors).toEqual([])
})

test('詰将棋ではライオンの危険な移動先も候補に表示する', async ({ page }) => {
  const errors = captureRuntimeErrors(page)

  await page.goto('/okashi/')
  await page.getByRole('button', { name: /詰将棋に挑戦/ }).click()
  await page.getByRole('button', { name: /まんなかを ふさごう/ }).click()

  await page.getByRole('button', { name: '3三 あんみつ', exact: true }).click()
  const unsafeTarget = page.getByRole('button', { name: '2二 空き', exact: true })
  await expect(unsafeTarget).toHaveClass(/target/)
  await unsafeTarget.click()

  await expect(page.getByText('不正解：応手があります')).toBeVisible()
  await expect(page.locator('.puzzle-guide')).toContainText('こちらのあんみつを取れます')
  await expect(page.locator('.puzzle-reply-target')).toHaveCount(1)
  expect(errors).toEqual([])
})

test('王手でない応手なしの手を詰みと表示しない', async ({ page }) => {
  const errors = captureRuntimeErrors(page)

  await page.goto('/okashi/')
  await page.getByRole('button', { name: /詰将棋に挑戦/ }).click()
  await page.getByRole('button', { name: /ちゅうおうへ ななめ/ }).click()
  await page.getByRole('button', { name: '2三 あんみつ', exact: true }).click()
  await page.getByRole('button', { name: '1三 空き', exact: true }).click()

  await expect(page.getByText('不正解：王手ではありません')).toBeVisible()
  await expect(page.getByText('王手になっていません', { exact: true })).toBeVisible()
  await expect(page.locator('.puzzle-guide')).toContainText('相手に合法手はありませんが、王手ではないため詰みではありません')
  await expect(page.getByText('相手の応手', { exact: true })).toHaveCount(0)
  await page.waitForTimeout(1_000)
  await expect(page.getByText('不正解：王手ではありません')).toBeVisible()
  expect(errors).toEqual([])
})

for (const game of [
  { path: 'okashi', title: 'おかししょうぎ', chick: 'こんぺいとう', lion: 'あんみつ' },
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
    await expect(page.locator('.turn-badge')).toContainText('後手の番')

    await page.getByRole('button', { name: `2一${game.lion}`, exact: true }).click()
    await expect(page.getByRole('button', { name: `2二${game.chick}`, exact: true })).toHaveClass(/target/)
    await page.getByRole('button', { name: `2二${game.chick}`, exact: true }).click()
    await expect(page.locator('.timeline')).toContainText('2 / 2 手')
    await expect(page.locator('.turn-badge')).toContainText('先手の番')
    await expect(page.getByRole('button', { name: `2二${game.lion}`, exact: true })).toBeVisible()
    const capturedChick = page.locator('.hand.gote button')
    await expect(capturedChick).toHaveAttribute('aria-label', new RegExp(`${game.chick}。置いたあとは前に1マス動けます`))
    await expect(capturedChick.locator('.hand-movement-guides i')).toHaveCount(1)
    await expect(page.locator('.hand.gote .hand-move-key')).toContainText('置いた後の動き')

    // 通常モードでは、取られる場所もライオン／大将の移動候補として隠さない。
    await page.getByRole('button', { name: `2四${game.lion}`, exact: true }).click()
    const unsafeLionMove = page.getByRole('button', { name: '2三空き', exact: true })
    await expect(unsafeLionMove).toHaveClass(/target/)
    await unsafeLionMove.click()
    await expect(page.locator('.result')).toContainText(`${game.lion}が取られる場所に動いてしまいました`)
    await expect(page.locator('.result > span')).toHaveText('❌')

    expect(errors).toEqual([])
  })
}

for (const game of [
  { path: 'okashi', name: 'おかししょうぎ' },
  { path: 'samurai', name: 'さむらいしょうぎ' },
]) {
  test(`${game.name}に独立したPWA設定がある`, async ({ page, request }) => {
    await page.goto(`/${game.path}/`)

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', './manifest.webmanifest')
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', './apple-touch-icon.png')

    const manifestResponse = await request.get(`/${game.path}/manifest.webmanifest`)
    expect(manifestResponse.ok()).toBe(true)
    const manifest = await manifestResponse.json()
    expect(manifest.name).toBe(game.name)
    expect(manifest.id).toBe('./')
    expect(manifest.display).toBe('standalone')

    for (const asset of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png']) {
      expect((await request.get(`/${game.path}/${asset}`)).ok()).toBe(true)
    }
    expect((await request.get('/sw.js')).ok()).toBe(true)
  })

  test(`${game.name}をオフラインで再表示できる`, async ({ page, context }) => {
    const errors = captureRuntimeErrors(page)
    await page.goto(`/${game.path}/`)
    await page.evaluate(() => navigator.serviceWorker.ready)
    await expect.poll(() => page.evaluate(() =>
      navigator.serviceWorker.controller?.scriptURL.endsWith('/sw.js') === true,
    )).toBe(true)
    await expectImagesLoaded(page, '.piece-icon')
    await page.waitForLoadState('networkidle')
    expect(errors).toEqual([])
    errors.length = 0

    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('heading', { name: game.name })).toBeVisible()
    await expectImagesLoaded(page, '.piece-icon')
    expect(errors.filter(error =>
      error.startsWith('page:') || error.startsWith('request: http://127.0.0.1:4173/'),
    )).toEqual([])
    await context.setOffline(false)
  })
}

for (const device of [
  { name: 'Android 360×800', width: 360, height: 800, path: 'okashi' },
  { name: 'Pixel 8a 412×915', width: 412, height: 915, path: 'samurai' },
  { name: 'iPad縦 768×1024', width: 768, height: 1024, path: 'okashi' },
  { name: 'iPad横 1024×768', width: 1024, height: 768, path: 'samurai' },
  { name: 'iPad Pro 11縦 834×1194', width: 834, height: 1194, path: 'samurai' },
  { name: 'iPad Pro 11横 1194×834', width: 1194, height: 834, path: 'okashi' },
]) {
  test(`${device.name}で対局と詰将棋が収まる`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height })

    await page.goto(`/${device.path}/`)
    await page.getByRole('button', { name: /対局する/ }).click()
    await expect(page.locator('.game-card')).toBeVisible()
    await expect(page.locator('.controls')).toBeVisible()
    await expectPageFitsViewport(page)
    await expectElementsFitViewport(page, ['.app-shell > header', '.game-card', '.game-card .board', '.controls'])

    await page.goto(`/${device.path}/`)
    await page.getByRole('button', { name: /詰将棋に挑戦/ }).click()
    await page.getByRole('button', { name: /まんなかを ふさごう/ }).click()
    await expect(page.locator('.puzzle-game')).toBeVisible()
    await expect(page.locator('.puzzle-guide')).toBeVisible()
    await expectPageFitsViewport(page)
    await expectElementsFitViewport(page, [
      '.puzzle-play-header',
      '.puzzle-game',
      '.puzzle-game .board',
      '.puzzle-guide',
      '.puzzle-guide-actions',
    ])
  })
}
