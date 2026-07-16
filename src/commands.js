import { SlashCommandBuilder } from 'discord.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('このBotの使い方を表示します'),

  new SlashCommandBuilder()
    .setName('digest')
    .setDescription('このチャンネルの直近の会話を整理します')
    .addIntegerOption((option) =>
      option
        .setName('count')
        .setDescription('取得するメッセージ数（10〜50、既定値50）')
        .setMinValue(10)
        .setMaxValue(50),
    )
    .addStringOption((option) =>
      option
        .setName('focus')
        .setDescription('特に確認したい話題（任意）')
        .setMaxLength(100),
    )
    .addBooleanOption((option) =>
      option
        .setName('private')
        .setDescription('自分だけに結果を表示する'),
    ),

  new SlashCommandBuilder()
    .setName('privacy')
    .setDescription('会話データの扱いと匿名化について表示します'),
].map((command) => command.toJSON());
