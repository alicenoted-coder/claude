import { NextRequest, NextResponse } from "next/server";
import {
  validateSignature,
  messagingApi,
  webhook,
} from "@line/bot-sdk";
import { Readable } from "node:stream";
import { recognizeImage } from "@/lib/recognize";
import type { RecognizedItem } from "@/lib/types";

export const runtime = "nodejs";

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

    // LINE 傳來的圖片訊息一律是 JPEG。辨識邏輯本身跟網頁版共用（lib/recognize.ts）。
    const { items } = await recognizeImage(
      imageBuffer.toString("base64"),
      "image/jpeg"
    );
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
