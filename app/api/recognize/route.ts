import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import type { RecognizeRequestBody, RecognizeResponseBody } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROMPT = `你是「家用品盤點助理」。使用者要盤點家裡的東西、然後挑出可以二手販售的物品。請仔細看這張照片，列出畫面中所有「具體、可獨立販售」的物品。

【一定要列】
- 3C / 家電（手機、筆電、相機、藍牙耳機、吹風機、小家電…）
- 服飾鞋包配件（衣服、鞋、包、帽、飾品、手錶）
- 美妝保養（化妝品、保養品、香水、護膚工具）
- 廚房用品（鍋具、餐具、小家電、保鮮盒）
- 家具寢具（如果是要盤點的家具本身）
- 書籍文具、玩具、運動器材、收藏品
- 食品飲料（未開封、有保存期限的）

【不要列】
- 商品標籤、價格貼紙、條碼、品牌貼紙等「附屬元素」（它是物品的一部分，不是獨立物品）
- 牆壁、地板、窗戶、桌面、櫃子背景（除非家具本身要販售）
- 空塑膠袋、垃圾、衛生紙
- 太籠統的描述（「東西」「物品」「容器」「瓶子」）

【命名原則】
- name：用繁體中文，**取主體內容物**而不是容器（例如「乳液」優於「乳液罐」、「精華液」優於「保養品瓶」）。盡量具體（「拖鞋」優於「鞋類」）。
- 如果同類有多個不同款式（不同顏色/容量/口味），請分開列出。
- 如果一個物品在畫面中真的出現多份，依實際數量分別列出。
- brand：如果看得到品牌或型號就填上（例如「Apple」「SK-II」「無印良品」）。看不清楚就回傳空字串 ""。

【category 必須從以下選一個】
電子產品、家電、服飾、鞋包配件、美妝保養、廚房用品、家具寢具、書籍文具、玩具運動、食品飲料、其他

【confidence】
0 到 1 之間的小數，代表你對這次辨識（name + brand）整體把握度。低於 0.5 的不要列。

若畫面沒有任何可賣的物品，回傳空陣列。`;

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
