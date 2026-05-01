export interface RecognizedItem {
  name: string;
  category: string;
  brand: string;
  confidence: number;
}

export interface RecognizeRequestBody {
  image: string;
  mimeType: string;
}

export interface RecognizeResponseBody {
  items: RecognizedItem[];
}

export interface PhotoState {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "compressing" | "recognizing" | "done" | "error";
  items?: RecognizedItem[];
  error?: string;
}
