import test from 'node:test';
import assert from 'node:assert/strict';
import { createParticipantAliases, sanitizeText } from '../src/privacy.js';

test('メールアドレス・URL・電話番号・メンションを伏せる', () => {
  const input = '連絡先 test@example.com、090-1234-5678、https://example.com、<@1234567890>';
  const result = sanitizeText(input);

  assert.equal(result.text.includes('test@example.com'), false);
  assert.equal(result.text.includes('090-1234-5678'), false);
  assert.equal(result.text.includes('https://example.com'), false);
  assert.equal(result.text.includes('<@1234567890>'), false);
  assert.ok(result.redactionCount >= 4);
});

test('投稿者を出現順の参加者番号に変換する', () => {
  const aliases = createParticipantAliases([
    { author: { id: 'a' } },
    { author: { id: 'b' } },
    { author: { id: 'a' } },
  ]);

  assert.equal(aliases.get('a'), '参加者1');
  assert.equal(aliases.get('b'), '参加者2');
  assert.equal(aliases.size, 2);
});
