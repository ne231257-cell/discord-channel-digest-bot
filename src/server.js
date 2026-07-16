import express from 'express';

export function startHttpServer({ port, getBotStatus }) {
  const app = express();

  app.get('/', (_request, response) => {
    const status = getBotStatus();
    response.type('html').send(`<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Discord Channel Digest Bot</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 64px auto; padding: 0 20px; line-height: 1.7; }
    code { background: #f1f1f1; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Discord Channel Digest Bot</h1>
  <p>Render上でサービスが起動しています。</p>
  <p>Discord Botの状態: <strong>${status}</strong></p>
  <p>Discordで <code>/help</code> または <code>/digest</code> を実行してください。</p>
</body>
</html>`);
  });

  app.get('/health', (_request, response) => {
    response.status(200).json({
      ok: true,
      bot: getBotStatus(),
      timestamp: new Date().toISOString(),
    });
  });

  return app.listen(port, '0.0.0.0', () => {
    console.log(`HTTPサーバーを0.0.0.0:${port}で起動しました。`);
  });
}
