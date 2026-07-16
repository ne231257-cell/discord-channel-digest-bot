import { REST, Routes } from 'discord.js';
import { commands } from './commands.js';

export async function registerCommands({ token, clientId, guildId }) {
  const rest = new REST({ version: '10' }).setToken(token);

  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: commands,
  });

  console.log(`スラッシュコマンドをサーバー ${guildId} に登録しました。`);
}
