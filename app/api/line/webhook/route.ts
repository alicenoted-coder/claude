import { NextRequest, NextResponse } from "next/server";
import {
  validateSignature,
  messagingApi,
  webhook,
} from "@line/bot-sdk";
import { Readable } from "node:stream";
import { GoogleGenAI, Type } from "@google/genai";

export const runtime = "nodejs";

const RECOGNIZE_PROMPT = `你是「家用品盤點助理」。使用者要盤點家裡的東西、然後挑出可以二手販售的物品。請仔細看這張照片，列出畫面中所有「具體、可獨立販售」的物品。

【一定要列】
- 3C / 家電（手機、筆電、相機、藍牙耳機、吹風機、小家電…）
- 服飾鞋包配件（衣服、鞋、包、帽、飾品、手錶）
- 美妝保養（化妝品、保養品、香水、護膚工具）
- 廚房用品（鍋具、餐具、小家電、保鮮盒）
- 家具寢具（如果是要盤點的家具本身）
- 書籍文具、玩具、運動器材、收藏品
- 食品飲料（未開封、有保存期限的）

【不要列】
- 商品標籤、價格貼紙、條碼、品牌貼紙等「附屬元素」
- 牆壁、地板、窗戶、桌面、櫃子背景（除非家具本身要販售）
- 空塑膠袋、垃圾、衛生紙
- 太籠統的描述（「東西」「物品」「容器」「瓶子」）

【命名原則】
- name：用繁體中文，取主體內容物而不是容器。盡量具體。
- 如果同類有多個不同款式，請分開列出。
- brand：如果看得到品牌或型號就填上。看不清楚就回傳空字串 ""。

【category 必須從以下選一個】
電子產品、家電、服飾、鞋包配件、美妝保養、廚房用品、家具寢具、書籍文具、玩具運動、食品飲料、其他

【confidence】
0 到 1 之間的小數，代表你對這次辨識（name + brand）整體把握度。低於 0.5 的不要列。

若畫面沒有任何可賣的物品，回傳空陣列。`;

const recognizeSchema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          brand: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
        },
        required: ["name", "category", "brand", "confidence"],
        propertyOrdering: ["name", "category", "brand", "confidence"],
      },
    },
  },
  required: ["items"],
  propertyOrdering: ["items"],
};

interface RecognizedItem {
  name: string;
  category: string;
  brand: string;
  confidence: number;
}

function getLineClients() {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) throw new Error("LINE_CHANNEL_ACCESS_TOKEN not set");
  const client = new messagingApi.MessagingApiClient({ channelAccessToken });
  const blobClient = new messagingApi.MessagingApiBlobClient({
    channelAccessToken,
  });
  return { client, blobClient };
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
  }
  return Buffer.concat(chunks);
}

async function recognizeImage(imageBuffer: Buffer): Promise<RecognizedItem[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const base64 = imageBuffer.toString("base64");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: RECOGNIZE_PROMPT },
          { inlineData: { mimeType: "image/jpeg", data: base64 } },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: recognizeSchema,
      temperature: 0.2,
    },
  });

  const text = response.text;
  if (!text) return [];

  const parsed = JSON.parse(text) as { items: RecognizedItem[] };
  return parsed.items ?? [];
}

function formatRecognitionResult(items: RecognizedItem[]): string {
  if (items.length === 0) {
    return "這張照片中沒有找到可以二手販售的物品。";
  }

  const lines = items.map((item) => {
    const brand = item.brand ? ` (${item.brand})` : "";
    const pct = Math.round(item.confidence * 100);
    return `• ${item.name}${brand}｜${item.category}｜信心度 ${pct}%`;
  });

  return `📦 找到 ${items.length} 件可販售物品：\n\n${lines.join("\n")}`;
}

function getReplyTarget(event: webhook.MessageEvent): string {
  const source = event.source;
  if (!source) return "";
  if (source.type === "user") {
    return (source as webhook.UserSource).userId ?? "";
  }
  if (source.type === "group") {
    return (source as webhook.GroupSource).groupId;
  }
  if (source.type === "room") {
    return (source as webhook.RoomSource).roomId;
  }
  return "";
}

async function handleImageMessage(
  client: messagingApi.MessagingApiClient,
  blobClient: messagingApi.MessagingApiBlobClient,
  event: webhook.MessageEvent & { message: webhook.ImageMessageContent }
) {
  const replyTarget = getReplyTarget(event);

  try {
    if (event.replyToken) {
      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: "text", text: "正在分析圖片，請稍候..." }],
      });
    }

    const stream = await blobClient.getMessageContent(event.message.id);
    const imageBuffer = await streamToBuffer(stream);

    const items = await recognizeImage(imageBuffer);
    const resultText = formatRecognitionResult(items);

    if (replyTarget) {
      await client.pushMessage({
        to: replyTarget,
        messages: [{ type: "text", text: resultText }],
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (replyTarget) {
      await client.pushMessage({
        to: replyTarget,
        messages: [{ type: "text", text: `分析失敗：${message}` }],
      });
    }
  }
}

async function handleTextMessage(
  client: messagingApi.MessagingApiClient,
  event: webhook.MessageEvent & { message: webhook.TextMessageContent }
) {
  if (!event.replyToken) return;
  await client.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: "text",
        text: "請傳送照片，我會幫你找出照片中可以二手販售的物品！📸",
      },
    ],
  });
}

async function handleFollowEvent(
  client: messagingApi.MessagingApiClient,
  event: webhook.FollowEvent
) {
  if (!event.replyToken) return;
  await client.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: "text",
        text: "歡迎使用家用品盤點助理！📦\n\n只要傳送家裡物品的照片，我就能幫你辨識出哪些東西可以二手販售。趕快試試看！",
      },
    ],
  });
}

export async function POST(request: NextRequest) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    return NextResponse.json(
      { error: "LINE_CHANNEL_SECRET not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";

  if (!validateSignature(body, channelSecret, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const callbackRequest = JSON.parse(body) as webhook.CallbackRequest;

  try {
    const { client, blobClient } = getLineClients();

    await Promise.all(
      callbackRequest.events.map(async (event) => {
        if (event.type === "follow") {
          await handleFollowEvent(client, event as webhook.FollowEvent);
        } else if (event.type === "message") {
          const msgEvent = event as webhook.MessageEvent;
          if (msgEvent.message.type === "image") {
            await handleImageMessage(
              client,
              blobClient,
              msgEvent as webhook.MessageEvent & {
                message: webhook.ImageMessageContent;
              }
            );
          } else if (msgEvent.message.type === "text") {
            await handleTextMessage(
              client,
              msgEvent as webhook.MessageEvent & {
                message: webhook.TextMessageContent;
              }
            );
          }
        }
      })
    );

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "LINE webhook endpoint is active" });
}
