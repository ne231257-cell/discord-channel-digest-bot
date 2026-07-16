import { EmbedBuilder } from 'discord.js';

function truncate(text, maxLength = 1000) {
  const normalized = String(text ?? '').trim();
  if (normalized.length <= maxLength) return normalized || 'なし';
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function sourceLinks(sourceIds, sourceMap) {
  const links = sourceIds
    .map((id) => {
      const source = sourceMap.get(id);
      return source ? `[${id}](${source.url})` : null;
    })
    .filter(Boolean);

  return links.length > 0 ? ` — 根拠: ${links.join(' ')}` : '';
}

function formatSimpleItems(items, sourceMap) {
  if (items.length === 0) return 'なし';
  return items
    .map((item, index) => `${index + 1}. ${item.text}${sourceLinks(item.source_ids, sourceMap)}`)
    .join('\n');
}

function formatTasks(tasks, sourceMap) {
  if (tasks.length === 0) return 'なし';
  return tasks
    .map((task, index) => {
      const metadata = `担当: ${task.assignee} / 期限: ${task.deadline}`;
      return `${index + 1}. ${task.text}\n   ${metadata}${sourceLinks(task.source_ids, sourceMap)}`;
    })
    .join('\n');
}

export function buildDigestEmbeds({ result, sourceMap, metadata, focus }) {
  const title = focus ? `会話ダイジェスト：${truncate(focus, 80)}` : 'チャンネル会話ダイジェスト';

  const mainEmbed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(truncate(result.overview, 1200))
    .addFields(
      {
        name: '決定事項',
        value: truncate(formatSimpleItems(result.decisions, sourceMap), 850),
      },
      {
        name: 'タスク',
        value: truncate(formatTasks(result.tasks, sourceMap), 850),
      },
      {
        name: '未解決の質問・論点',
        value: truncate(formatSimpleItems(result.open_questions, sourceMap), 850),
      },
    )
    .setTimestamp()
    .setFooter({
      text: `${metadata.messageCount}件・${metadata.participantCount}名を分析 / AIの整理結果は根拠リンクから確認してください`,
    });

  const actionEmbed = new EmbedBuilder()
    .setTitle('次に確認すること')
    .addFields(
      { name: '推奨する次の一歩', value: truncate(result.next_step, 650) },
      { name: '注意・不確実な点', value: truncate(result.uncertainty, 650) },
    );

  if (metadata.redactionCount > 0) {
    actionEmbed.addFields({
      name: '匿名化',
      value: `Geminiへ送る前に、${metadata.redactionCount}件のメールアドレス・URL・電話番号などを伏せました。`,
    });
  }

  return [mainEmbed, actionEmbed];
}

export function buildHelpEmbed() {
  return new EmbedBuilder()
    .setTitle('Channel Digest Bot の使い方')
    .setDescription('このBotは、現在のDiscordチャンネルの直近の会話をGeminiで整理します。会話全文は保存しません。')
    .addFields(
      {
        name: '/digest',
        value: '直近50件を、概要・決定事項・タスク・未解決点に整理します。`count`で10〜50件を指定できます。',
      },
      {
        name: '/digest focus:発表準備',
        value: '特定の話題を優先して整理します。',
      },
      {
        name: '/digest private:True',
        value: '結果を実行した本人だけに表示します。',
      },
      {
        name: '/privacy',
        value: '匿名化とデータの扱いを確認します。',
      },
    )
    .setFooter({ text: '要約内容はAIが生成します。重要な判断は元メッセージへのリンクで確認してください。' });
}

export function buildPrivacyEmbed() {
  return new EmbedBuilder()
    .setTitle('データとプライバシー')
    .setDescription('この課題用Botは、実行時に取得した会話を要約のためだけに使用し、データベースやファイルには保存しません。')
    .addFields(
      {
        name: 'Geminiへ送る前の処理',
        value: 'Discordの表示名・ユーザーIDを「参加者1」のような番号へ置換し、メールアドレス、電話番号、URL、メンション、IPアドレス、長い機密文字列を伏せます。',
      },
      {
        name: '対象外',
        value: '添付ファイルの中身、画像、リンク先の内容は解析しません。',
      },
      {
        name: '利用上の注意',
        value: '住所や氏名など、文章中に直接書かれた個人情報を完全に検出できるとは限りません。課題の動作確認には架空の会話を使用してください。',
      },
    );
}
