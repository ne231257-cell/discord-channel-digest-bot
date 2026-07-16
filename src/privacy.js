const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>()]+/gi;
const PHONE_PATTERN = /(?<!\d)(?:\+?81[-\s]?)?(?:0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})(?!\d)/g;
const IPV4_PATTERN = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const DISCORD_MENTION_PATTERN = /<@!?\d+>|<@&\d+>|<#\d+>/g;
const LONG_SECRET_PATTERN = /\b[A-Za-z0-9_\-.]{32,}\b/g;

function replaceAndCount(text, pattern, replacement, state) {
  return text.replace(pattern, () => {
    state.count += 1;
    return replacement;
  });
}

export function sanitizeText(input) {
  const state = { count: 0 };
  let text = String(input ?? '');

  text = replaceAndCount(text, EMAIL_PATTERN, '[メールアドレス]', state);
  text = replaceAndCount(text, URL_PATTERN, '[URL]', state);
  text = replaceAndCount(text, PHONE_PATTERN, '[電話番号]', state);
  text = replaceAndCount(text, IPV4_PATTERN, '[IPアドレス]', state);
  text = replaceAndCount(text, DISCORD_MENTION_PATTERN, '@参加者', state);
  text = replaceAndCount(text, LONG_SECRET_PATTERN, '[機密文字列]', state);

  return {
    text: text.replace(/\s+/g, ' ').trim(),
    redactionCount: state.count,
  };
}

export function createParticipantAliases(messages) {
  const aliases = new Map();
  let nextNumber = 1;

  for (const message of messages) {
    const authorId = message.author?.id;
    if (authorId && !aliases.has(authorId)) {
      aliases.set(authorId, `参加者${nextNumber}`);
      nextNumber += 1;
    }
  }

  return aliases;
}
