import {
  ActivityType,
  Client,
  GatewayIntentBits,
} from 'discord.js';
import { config } from './config.js';
import { registerCommands } from './register-commands.js';
import { GeminiSummarizer } from './gemini.js';
import { createInteractionHandler } from './handlers.js';
import { startHttpServer } from './server.js';

let botStatus = '起動中';

const httpServer = startHttpServer({
  port: config.port,
  getBotStatus: () => botStatus,
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const summarizer = new GeminiSummarizer({
  apiKey: config.geminiApiKey,
  model: config.geminiModel,
});

client.once('ready', async (readyClient) => {
  botStatus = 'オンライン';
  console.log(`${readyClient.user.tag} としてDiscordへ接続しました。`);

  readyClient.user.setActivity('/digest で会話を整理', {
    type: ActivityType.Listening,
  });

  try {
    await registerCommands({
      token: config.discordToken,
      clientId: config.discordClientId,
      guildId: config.discordGuildId,
    });
  } catch (error) {
    console.error('スラッシュコマンド登録に失敗しました:', error);
  }
});

client.on('interactionCreate', createInteractionHandler({ summarizer }));

client.on('error', (error) => {
  botStatus = 'Discordエラー';
  console.error('Discord Client Error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

async function shutdown(signal) {
  console.log(`${signal}を受信したため終了します。`);
  botStatus = '終了処理中';
  client.destroy();
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

try {
  await client.login(config.discordToken);
} catch (error) {
  botStatus = 'ログイン失敗';
  console.error('Discordへのログインに失敗しました:', error);
}
