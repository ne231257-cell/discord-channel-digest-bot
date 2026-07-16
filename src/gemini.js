import { GoogleGenAI } from '@google/genai';

const summarySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    overview: {
      type: 'string',
      description: '会話全体の簡潔な概要。事実のみを日本語で記述する。',
    },
    decisions: {
      type: 'array',
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          text: { type: 'string', description: '明確に合意・決定された内容。' },
          source_ids: {
            type: 'array',
            maxItems: 3,
            items: { type: 'string' },
            description: '根拠となるM01形式のメッセージID。',
          },
        },
        required: ['text', 'source_ids'],
      },
    },
    tasks: {
      type: 'array',
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          text: { type: 'string', description: '会話から読み取れる具体的な作業。' },
          assignee: {
            type: 'string',
            description: '明示された参加者番号。明示がなければ「未定」。',
          },
          deadline: {
            type: 'string',
            description: '明示された期限。明示がなければ「未定」。',
          },
          source_ids: {
            type: 'array',
            maxItems: 3,
            items: { type: 'string' },
            description: '根拠となるM01形式のメッセージID。',
          },
        },
        required: ['text', 'assignee', 'deadline', 'source_ids'],
      },
    },
    open_questions: {
      type: 'array',
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          text: { type: 'string', description: 'まだ答えや結論が出ていない質問・論点。' },
          source_ids: {
            type: 'array',
            maxItems: 3,
            items: { type: 'string' },
            description: '根拠となるM01形式のメッセージID。',
          },
        },
        required: ['text', 'source_ids'],
      },
    },
    next_step: {
      type: 'string',
      description: '会話に基づく最も自然な次の一歩。新しい事実を作らない。',
    },
    uncertainty: {
      type: 'string',
      description: '判断できなかった点や、要確認の注意事項。なければ「特になし」。',
    },
  },
  required: ['overview', 'decisions', 'tasks', 'open_questions', 'next_step', 'uncertainty'],
};

function buildPrompt({ transcript, focus }) {
  const focusInstruction = focus
    ? `特に「${focus}」に関係する内容を優先してください。ただし、会話にない情報は追加しないでください。`
    : '会話全体を偏りなく整理してください。';

  return `あなたはDiscord上のプロジェクト会話を整理するアシスタントです。
以下の会話を読み、実務でそのまま使える議事整理を作成してください。

ルール:
- 会話に書かれている事実だけを使う。
- 提案や検討中の内容を「決定事項」にしない。
- 担当者や期限が明示されていない場合は必ず「未定」とする。
- 各項目のsource_idsには、根拠となる[M01]形式のIDだけを入れる。
- 雑談は、作業に影響しない限り省略する。
- 個人を推測したり、参加者番号以外の人物名を作らない。
- 日本語で、短く具体的に書く。
- decisions、tasks、open_questionsがない場合は空配列にする。
${focusInstruction}

会話:
${transcript}`;
}

function normalizeSourceIds(ids, validSourceIds) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids)]
    .filter((id) => typeof id === 'string' && validSourceIds.has(id))
    .slice(0, 3);
}

function normalizeResult(result, validSourceIds) {
  const normalizeItems = (items) => (Array.isArray(items) ? items : [])
    .filter((item) => item && typeof item.text === 'string' && item.text.trim())
    .map((item) => ({
      ...item,
      text: item.text.trim(),
      source_ids: normalizeSourceIds(item.source_ids, validSourceIds),
    }));

  return {
    overview: String(result.overview ?? '').trim() || '要約を作成できませんでした。',
    decisions: normalizeItems(result.decisions).slice(0, 6),
    tasks: normalizeItems(result.tasks).slice(0, 8).map((item) => ({
      ...item,
      assignee: String(item.assignee ?? '未定').trim() || '未定',
      deadline: String(item.deadline ?? '未定').trim() || '未定',
    })),
    open_questions: normalizeItems(result.open_questions).slice(0, 6),
    next_step: String(result.next_step ?? '').trim() || '会話を確認し、次の作業を決めてください。',
    uncertainty: String(result.uncertainty ?? '').trim() || '特になし',
  };
}

export class GeminiSummarizer {
  constructor({ apiKey, model }) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async summarize({ transcript, focus, validSourceIds }) {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: buildPrompt({ transcript, focus }),
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseJsonSchema: summarySchema,
      },
    });

    if (!response.text) {
      throw new Error('Geminiから空の応答が返されました。');
    }

    let parsed;
    try {
      parsed = JSON.parse(response.text);
    } catch (error) {
      throw new Error(`GeminiのJSON応答を解析できませんでした: ${error.message}`);
    }

    return normalizeResult(parsed, validSourceIds);
  }
}
