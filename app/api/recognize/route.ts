import { NextResponse } from "next/server";
import {
  recognizeImage,
  MissingApiKeyError,
  EmptyModelResponseError,
} from "@/lib/recognize";
import type { RecognizeRequestBody, RecognizeResponseBody } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
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
    const result = await recognizeImage(body.image, body.mimeType);
    return NextResponse.json(result satisfies RecognizeResponseBody);
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (error instanceof EmptyModelResponseError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Recognition failed: ${message}` },
      { status: 502 }
    );
  }
}
