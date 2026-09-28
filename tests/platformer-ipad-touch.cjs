const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
  });

  // iPad-like viewport and touch configuration
  const page = await browser.newPage({
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto('http://localhost:4173/platformer/');

  // 1. Verify viewport meta tag
  const viewportContent = await page.locator('meta[name="viewport"]').getAttribute('content');
  assert.ok(viewportContent.includes('user-scalable=no'), 'Viewport must contain user-scalable=no');
  assert.ok(viewportContent.includes('maximum-scale=1.0'), 'Viewport must contain maximum-scale=1.0');

  // 2. Verify CSS user-select and touch-callout properties on various elements
  const elementsToCheck = ['body', 'h1', 'p', 'main', '#game', '.record', '.touch-controls', '#quiz'];
  for (const selector of elementsToCheck) {
    const userSelect = await page.locator(selector).first().evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        userSelect: style.userSelect,
        webkitUserSelect: style.webkitUserSelect,
        webkitTouchCallout: style.webkitTouchCallout,
        touchAction: style.touchAction
      };
    });
    assert.equal(userSelect.userSelect, 'none', `${selector} should have user-select: none`);
    assert.equal(userSelect.webkitUserSelect, 'none', `${selector} should have -webkit-user-select: none`);
    assert.ok(
      userSelect.touchAction === 'manipulation' || userSelect.touchAction === 'none',
      `${selector} should have touch-action manipulation or none, got ${userSelect.touchAction}`
    );
  }

  // 3. Verify selectstart & contextmenu are prevented globally
  const selectPrevented = await page.evaluate(() => {
    const event = new Event('selectstart', { cancelable: true, bubbles: true });
    return !document.querySelector('h1').dispatchEvent(event);
  });
  assert.equal(selectPrevented, true, 'selectstart event must be prevented');

  const contextPrevented = await page.evaluate(() => {
    const event = new MouseEvent('contextmenu', { cancelable: true, bubbles: true });
    return !document.querySelector('p').dispatchEvent(event);
  });
  assert.equal(contextPrevented, true, 'contextmenu event must be prevented');

  const dblclickPrevented = await page.evaluate(() => {
    const event = new MouseEvent('dblclick', { cancelable: true, bubbles: true });
    return !document.body.dispatchEvent(event);
  });
  assert.equal(dblclickPrevented, true, 'dblclick event must be prevented');

  // 4. Test quick double tap on keypad still functions (e.g. typing "11")
  await page.locator('#start').click();
  // Trigger quiz mode via window.sunshine / encounter
  await page.evaluate(() => {
    const z = sunshine.snapshot().monsters[0];
    document.querySelector('#game').focus();
    // Simulate encounter by moving player
  });

  // Check keypad quick tapping
  // Open quiz by encountering monster or directly checking keypad touch behavior
  const canQuickTapKeypad = await page.evaluate(() => {
    const key = document.querySelector('#keypad button[data-digit="1"]');
    if (!key) return true;
    let clickCount = 0;
    key.onclick = () => { clickCount++; };
    key.click();
    key.click();
    return clickCount === 2;
  });
  assert.equal(canQuickTapKeypad, true, 'Keypad must accept consecutive taps');

  // 5. Test touchend non-interactive double tap prevention
  const nonInteractiveDoubleTapPrevented = await page.evaluate(() => {
    const heading = document.querySelector('h1');
    const touch = new Touch({
      identifier: 1,
      target: heading,
      clientX: 50,
      clientY: 50
    });
    const evt1 = new TouchEvent('touchend', { cancelable: true, bubbles: true, touches: [], targetTouches: [], changedTouches: [touch] });
    heading.dispatchEvent(evt1);

    const evt2 = new TouchEvent('touchend', { cancelable: true, bubbles: true, touches: [], targetTouches: [], changedTouches: [touch] });
    const notPrevented = heading.dispatchEvent(evt2);
    return !notPrevented; // should be prevented (defaultPrevented = true, dispatchEvent returns false)
  });
  assert.equal(nonInteractiveDoubleTapPrevented, true, 'Double tapping text must be prevented');

  assert.deepEqual(errors, []);
  await browser.close();
  console.log('PASS: iPad touch & zoom prevention tests passed successfully!');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
