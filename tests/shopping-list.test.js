const { chromium } = require('playwright');
const path = require('path');

const FILE_URL = 'file:///' + path.resolve(__dirname, '../shopping-list.html').replace(/\\/g, '/');
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');

async function screenshot(page, name) {
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  📸 저장: screenshots/${name}.png`);
}

function pass(msg) { console.log(`  ✅ ${msg}`); }
function fail(msg) { console.log(`  ❌ ${msg}`); throw new Error(msg); }

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 600, height: 700 });

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`\n🧪 ${name}\n`);
    try {
      await fn();
      passed++;
    } catch (e) {
      console.log(`  오류: ${e.message}`);
      failed++;
    }
  }

  await page.goto(FILE_URL);

  // ── 초기 상태 ──────────────────────────────────────────
  await test('초기 상태: 빈 리스트 메시지 표시', async () => {
    const empty = await page.locator('#empty');
    const visible = await empty.isVisible();
    if (!visible) fail('빈 리스트 메시지가 보이지 않음');
    pass('빈 리스트 메시지 표시됨');
    await screenshot(page, '01_initial_state');
  });

  // ── 아이템 추가 ─────────────────────────────────────────
  await test('아이템 추가: 버튼 클릭으로 추가', async () => {
    await page.fill('#itemInput', '사과');
    await page.click('button.add-btn');
    const items = await page.locator('#list li').count();
    if (items !== 1) fail(`아이템 수 기대값 1, 실제값 ${items}`);
    const text = await page.locator('#list li .item-text').first().textContent();
    if (text !== '사과') fail(`텍스트 기대값 '사과', 실제값 '${text}'`);
    pass(`아이템 '사과' 추가됨`);
    await screenshot(page, '02_add_item_button');
  });

  await test('아이템 추가: Enter 키로 추가', async () => {
    await page.fill('#itemInput', '바나나');
    await page.press('#itemInput', 'Enter');
    const items = await page.locator('#list li').count();
    if (items !== 2) fail(`아이템 수 기대값 2, 실제값 ${items}`);
    pass(`아이템 '바나나' Enter 키로 추가됨`);
    await screenshot(page, '03_add_item_enter');
  });

  await test('아이템 추가: 빈 값 입력 시 추가 안됨', async () => {
    await page.fill('#itemInput', '   ');
    await page.click('button.add-btn');
    const items = await page.locator('#list li').count();
    if (items !== 2) fail(`빈 값이 추가됨 (아이템 수: ${items})`);
    pass('빈 값 추가 차단됨');
  });

  await test('아이템 추가: 추가 후 입력창 초기화', async () => {
    await page.fill('#itemInput', '우유');
    await page.click('button.add-btn');
    const val = await page.inputValue('#itemInput');
    if (val !== '') fail(`입력창이 비워지지 않음: '${val}'`);
    pass('입력창 자동 초기화됨');
    await screenshot(page, '04_three_items');
  });

  await test('아이템 추가 후 빈 리스트 메시지 숨김', async () => {
    const empty = await page.locator('#empty');
    const visible = await empty.isVisible();
    if (visible) fail('아이템이 있는데 빈 메시지가 보임');
    pass('빈 리스트 메시지 숨겨짐');
  });

  // ── 체크박스 ────────────────────────────────────────────
  await test('체크박스: 체크 시 텍스트에 취소선 적용', async () => {
    const firstCb = page.locator('#list li input[type="checkbox"]').first();
    const firstText = page.locator('#list li .item-text').first();
    await firstCb.check();
    const hasDone = await firstText.evaluate(el => el.classList.contains('done'));
    if (!hasDone) fail('체크 후 done 클래스 없음');
    pass("'사과' 체크 → done 클래스 적용됨");
    await screenshot(page, '05_checkbox_checked');
  });

  await test('체크박스: 체크 해제 시 취소선 제거', async () => {
    const firstCb = page.locator('#list li input[type="checkbox"]').first();
    const firstText = page.locator('#list li .item-text').first();
    await firstCb.uncheck();
    const hasDone = await firstText.evaluate(el => el.classList.contains('done'));
    if (hasDone) fail('체크 해제 후 done 클래스가 남아있음');
    pass("'사과' 체크 해제 → done 클래스 제거됨");
    await screenshot(page, '06_checkbox_unchecked');
  });

  await test('체크박스: 여러 아이템 동시 체크', async () => {
    const checkboxes = page.locator('#list li input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) await checkboxes.nth(i).check();
    const doneItems = await page.locator('#list li .item-text.done').count();
    if (doneItems !== count) fail(`done 아이템 수 기대값 ${count}, 실제값 ${doneItems}`);
    pass(`전체 ${count}개 아이템 체크 완료`);
    await screenshot(page, '07_all_checked');
  });

  // ── 삭제 ────────────────────────────────────────────────
  await test('삭제: 첫 번째 아이템 삭제', async () => {
    const beforeCount = await page.locator('#list li').count();
    await page.locator('#list li button.del-btn').first().click();
    const afterCount = await page.locator('#list li').count();
    if (afterCount !== beforeCount - 1) fail(`삭제 후 아이템 수 기대값 ${beforeCount - 1}, 실제값 ${afterCount}`);
    pass(`삭제 성공 (${beforeCount} → ${afterCount}개)`);
    await screenshot(page, '08_after_delete_first');
  });

  await test('삭제: 모든 아이템 삭제 후 빈 메시지 표시', async () => {
    const delBtns = page.locator('#list li button.del-btn');
    while (await delBtns.count() > 0) {
      await delBtns.first().click();
    }
    const empty = await page.locator('#empty');
    const visible = await empty.isVisible();
    if (!visible) fail('모두 삭제 후 빈 리스트 메시지가 보이지 않음');
    pass('모두 삭제 → 빈 리스트 메시지 복원됨');
    await screenshot(page, '09_all_deleted');
  });

  // ── 최종 상태 ───────────────────────────────────────────
  await test('재추가: 삭제 후 새 아이템 추가 가능', async () => {
    await page.fill('#itemInput', '딸기');
    await page.click('button.add-btn');
    const count = await page.locator('#list li').count();
    if (count !== 1) fail(`재추가 후 아이템 수 기대값 1, 실제값 ${count}`);
    pass("삭제 후 '딸기' 재추가 성공");
    await screenshot(page, '10_final_state');
  });

  await browser.close();

  // ── 결과 요약 ───────────────────────────────────────────
  console.log('\n' + '─'.repeat(40));
  console.log(`테스트 결과: ${passed + failed}개 실행 | ✅ ${passed}개 통과 | ❌ ${failed}개 실패`);
  if (failed === 0) {
    console.log('🎉 모든 테스트 통과!');
  } else {
    console.log('⚠️  일부 테스트 실패');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('테스트 실행 오류:', err);
  process.exit(1);
});
