import { PermissionFlagsBits } from 'discord.js';
import { collectChannelMessages } from './message-collector.js';
import { buildDigestEmbeds, buildHelpEmbed, buildPrivacyEmbed } from './formatter.js';

const GENERIC_ERROR_MESSAGE = '処理中にエラーが発生しました。RenderのLogsを確認してください。';

function hasRequiredPermissions(channel, botMember) {
  const permissions = channel.permissionsFor(botMember);
  return permissions?.has([
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.EmbedLinks,
  ]);
}

export function createInteractionHandler({ summarizer }) {
  return async function handleInteraction(interaction) {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'help') {
      await interaction.reply({ embeds: [buildHelpEmbed()], ephemeral: true });
      return;
    }

    if (interaction.commandName === 'privacy') {
      await interaction.reply({ embeds: [buildPrivacyEmbed()], ephemeral: true });
      return;
    }

    if (interaction.commandName !== 'digest') return;

    const isPrivate = interaction.options.getBoolean('private') ?? false;
    await interaction.deferReply({ ephemeral: isPrivate });

    try {
      if (!interaction.inGuild() || !interaction.channel?.isTextBased()) {
        await interaction.editReply('このコマンドはDiscordサーバー内のテキストチャンネルで使用してください。');
        return;
      }

      const botMember = interaction.guild.members.me ?? await interaction.guild.members.fetchMe();
      if (!hasRequiredPermissions(interaction.channel, botMember)) {
        await interaction.editReply('Botに「チャンネルを見る・メッセージ履歴を読む・メッセージを送る・埋め込みリンク」の権限が必要です。');
        return;
      }

      const requestedCount = interaction.options.getInteger('count') ?? 50;
      const focus = interaction.options.getString('focus')?.trim() || null;
      const collected = await collectChannelMessages(interaction.channel, requestedCount);

      if (collected.messageCount < 3) {
        await interaction.editReply('分析できる通常メッセージが3件未満です。会話を増やしてから再度実行してください。');
        return;
      }

      const validSourceIds = new Set(collected.sourceMap.keys());
      const result = await summarizer.summarize({
        transcript: collected.transcript,
        focus,
        validSourceIds,
      });

      const embeds = buildDigestEmbeds({
        result,
        sourceMap: collected.sourceMap,
        metadata: collected,
        focus,
      });

      await interaction.editReply({
        content: '直近の会話を整理しました。',
        embeds,
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      console.error('digestコマンドでエラー:', error);

      const detail = error?.message?.includes('429')
        ? 'Gemini APIの無料枠またはレート制限に達した可能性があります。少し時間を置いて再実行してください。'
        : GENERIC_ERROR_MESSAGE;

      await interaction.editReply(detail).catch(() => undefined);
    }
  };
}
