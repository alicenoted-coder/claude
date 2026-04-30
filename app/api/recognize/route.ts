import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import type { RecognizeRequestBody, RecognizeResponseBody } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROMPT = `你是一個物品辨識助理。請仔細看這張照片，列出畫面中所有可以辨識出來的具體物品。

規則：
- name 必須是繁體中文，使用一般人會用的名稱（例如「水杯」「筆記型電腦」「拖鞋」）。
- category 用簡短中文分類（例如「電子產品」「廚房用品」「文具」「衣物」「食物」「家具」「個人物品」「其他」）。
- confidence 是 0 到 1 之間的小數，代表你對這個辨識的把握程度。
- 不要列出太籠統的東西（例如「房間」「桌面」），只列出可獨立辨識的物品。
- 如果同一個物品在畫面中出現多次，請依實際數量分別列出（每筆一個 item）。
- 若畫面中沒有可辨識的物品，回傳空陣列。`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
        },
        required: ["name", "category", "confidence"],
        propertyOrdering: ["name", "category", "confidence"],
      },
    },
  },
  required: ["items"],
  propertyOrdering: ["items"],
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server" },
      { status: 500 }
    );
  }

  let body: RecognizeRequestBody;
  try {
    body = (await request.json()) as RecognizeRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.image || !body.mimeType) {
    return NextResponse.json(
      { error: "Missing image or mimeType" },
      { status: 400 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType: body.mimeType, data: body.image } },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "Empty response from model" },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(text) as RecognizeResponseBody;
    return NextResponse.json(parsed satisfies RecognizeResponseBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Recognition failed: ${message}` },
      { status: 502 }
    );
  }
}
