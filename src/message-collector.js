import { createParticipantAliases, sanitizeText } from './privacy.js';

const MAX_TOTAL_CHARACTERS = 45_000;

function formatTimestamp(date) {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(date).replaceAll('/', '-');
}

export async function collectChannelMessages(channel, requestedCount) {
  const fetched = await channel.messages.fetch({ limit: requestedCount });

  const usableMessages = [...fetched.values()]
    .filter((message) => !message.author?.bot)
    .filter((message) => !message.system)
    .filter((message) => message.content?.trim() || message.attachments.size > 0)
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const aliases = createParticipantAliases(usableMessages);
  const sourceMap = new Map();
  const lines = [];
  let totalCharacters = 0;
  let redactionCount = 0;

  for (const [index, message] of usableMessages.entries()) {
    const sourceId = `M${String(index + 1).padStart(2, '0')}`;
    const alias = aliases.get(message.author.id) ?? '参加者';
    const attachmentNote = message.attachments.size > 0
      ? ` [添付ファイル${message.attachments.size}件・内容は未解析]`
      : '';
    const sanitized = sanitizeText(`${message.content ?? ''}${attachmentNote}`);
    redactionCount += sanitized.redactionCount;

    const line = `[${sourceId}] ${formatTimestamp(message.createdAt)} ${alias}: ${sanitized.text}`;
    if (totalCharacters + line.length > MAX_TOTAL_CHARACTERS) {
      break;
    }

    lines.push(line);
    sourceMap.set(sourceId, {
      url: message.url,
      createdAt: message.createdAt,
    });
    totalCharacters += line.length;
  }

  return {
    transcript: lines.join('\n'),
    sourceMap,
    messageCount: lines.length,
    participantCount: aliases.size,
    redactionCount,
  };
}
