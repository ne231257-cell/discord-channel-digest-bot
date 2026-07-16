# Discord Channel Digest Bot

Discordチャンネルの直近10〜50件の会話をGemini APIで整理する課題用Botです。

## 機能

- `/help`：使い方を表示
- `/digest`：会話を概要・決定事項・タスク・未解決点へ整理
- `/digest focus:話題`：指定した話題を優先
- `/digest private:True`：本人だけに結果を表示
- `/privacy`：匿名化とデータの扱いを表示
- 各項目に元Discordメッセージへの根拠リンクを表示
- RenderのURLへアクセスできるHTTPサーバーと`/health`を提供

## 課題条件との対応

- Discordのチャットボット：discord.jsを使用
- 生成AI：Gemini APIを使用
- 実用性：グループ課題・制作・プロジェクトの会話整理に利用
- `/help`：実装済み
- Render：Web Serviceとして動作する構成

PostgreSQLは使用していません。課題の「PostgreSQLまたは生成AI」の条件はGemini APIで満たしています。

## 必要なもの

- Node.js 22.12.0以上
- DiscordアカウントとBotを追加できるサーバー
- Googleアカウント
- GitHubアカウント
- Renderアカウント

## 1. ファイルを準備

ZIPを展開し、フォルダ内で次を実行します。

```bash
npm install
cp .env.example .env
```

Windowsでは`.env.example`をコピーし、ファイル名を`.env`へ変更してください。

## 2. Discord Botを作成

1. Discord Developer Portalを開く。
2. `New Application`を押してアプリ名を入力する。
3. `General Information`の`APPLICATION ID`を控える。
4. 左側の`Bot`を開き、必要なら`Reset Token`からTokenを発行して控える。
5. `Privileged Gateway Intents`の`MESSAGE CONTENT INTENT`をONにする。
6. Discordの設定で`詳細設定 > 開発者モード`をONにする。
7. Botを使うサーバーを右クリックし、`サーバーIDをコピー`する。

### Botをサーバーへ追加

次のURLの`YOUR_CLIENT_ID`をApplication IDへ置き換え、ブラウザで開きます。

```text
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=84992&integration_type=0&scope=bot+applications.commands
```

付与する権限は次の4つです。

- View Channels
- Send Messages
- Embed Links
- Read Message History

## 3. Gemini APIキーを作成

1. Google AI Studioを開く。
2. `Get API key`からAPIキーを作成する。
3. APIキーを控える。

既定モデルは安定版の`gemini-2.5-flash`です。

## 4. `.env`を設定

```env
DISCORD_TOKEN=DiscordのBot Token
DISCORD_CLIENT_ID=Application ID
DISCORD_GUILD_ID=サーバーID
GEMINI_API_KEY=Gemini APIキー
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
```

TokenとAPIキーは他人へ送らず、GitHubにもアップロードしないでください。`.gitignore`により`.env`は除外されます。

## 5. ローカルで確認

```bash
npm run check
npm test
npm start
```

正常なら、ターミナルに次のようなログが表示されます。

```text
HTTPサーバーを0.0.0.0:3000で起動しました。
Bot名 としてDiscordへ接続しました。
スラッシュコマンドをサーバー ... に登録しました。
```

ブラウザで`http://localhost:3000`を開き、Discordで`/help`と`/digest`を試します。

## 6. GitHubへアップロード

1. GitHubで新しいリポジトリを作成する。
2. ZIPを展開したフォルダ内のファイルをアップロードする。
3. `.env`がアップロード対象に含まれていないことを必ず確認する。

Gitコマンドを使う場合：

```bash
git init
git add .
git commit -m "Create Discord channel digest bot"
git branch -M main
git remote add origin あなたのGitHubリポジトリURL
git push -u origin main
```

## 7. Renderへデプロイ

1. Renderへログインする。
2. `New > Web Service`を選ぶ。
3. GitHubのリポジトリを接続する。
4. 次の内容を設定する。

| 項目 | 設定値 |
|---|---|
| Language | Node |
| Build Command | `npm install --no-audit --no-fund` |
| Start Command | `npm start` |
| Health Check Path | `/health` |
| Instance Type | Free |

5. Environmentへ次を追加する。

| Key | Value |
|---|---|
| `DISCORD_TOKEN` | Discord Bot Token |
| `DISCORD_CLIENT_ID` | Application ID |
| `DISCORD_GUILD_ID` | サーバーID |
| `GEMINI_API_KEY` | Gemini APIキー |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `NODE_VERSION` | `22.12.0` |

6. `Create Web Service`を押す。
7. LogsにDiscord接続成功とコマンド登録成功が表示されることを確認する。
8. 発行された`https://...onrender.com`をブラウザで開く。
9. Discordで`/help`と`/digest`を実行する。

`render.yaml`も同梱しているため、Render Blueprintから作成する方法でも構いません。

## 8. 動作確認

`docs/動作確認用の架空会話.md`の内容をDiscordへ投稿し、次を実行します。

```text
/digest count:50
```

確認する点：

- 概要が表示される
- 決定事項とタスクが分かれる
- 未解決の質問が表示される
- M番号を押すと元メッセージへ移動する
- `/help`が表示される
- Render URLがブラウザで開ける

## トラブルシューティング

### `/digest`でメッセージを読めない

- Developer Portalの`MESSAGE CONTENT INTENT`をONにする。
- Botに`Read Message History`と`View Channels`を付ける。
- 設定後にRenderで`Manual Deploy > Restart service`を行う。

### スラッシュコマンドが表示されない

- `DISCORD_CLIENT_ID`と`DISCORD_GUILD_ID`を確認する。
- Bot招待時に`applications.commands`スコープを含める。
- RenderのLogsでコマンド登録エラーを確認する。

### Geminiで429エラーが出る

無料枠またはレート制限の可能性があります。少し時間を置き、連続実行を避けてください。

### Renderでポートエラーが出る

このBotは`process.env.PORT`へ`0.0.0.0`で接続します。Start Commandが`npm start`になっているか確認してください。

## プライバシー

- 会話はデータベースやファイルに保存しない
- 投稿者名とDiscord IDはGeminiへ送らない
- 投稿者は実行ごとに`参加者1`などへ匿名化
- メールアドレス、URL、電話番号、メンション、IPアドレス、長い機密文字列を伏せる
- 添付ファイルの中身は解析しない

ただし、文章中に直接書かれた氏名や住所を完全に検出できる保証はありません。提出用の確認には架空の会話を使用してください。
