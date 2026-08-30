import { PDFParse } from "pdf-parse";
import * as DxfParserModule from "dxf-parser";
import { createWorker } from "tesseract.js";
import type { DetectedFeature, UploadArtifact } from "./types.js";

interface DrawingAnalysis {
  aggregatedText: string;
  features: DetectedFeature[];
}

function bufferFromUpload(upload: UploadArtifact): Buffer {
  return Buffer.from(upload.contentBase64, "base64");
}

function normalizeText(raw: string): string {
  return raw
    .replace(/×/g, "x")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueFeatures(features: DetectedFeature[]): DetectedFeature[] {
  const keySet = new Set<string>();
  const result: DetectedFeature[] = [];
  for (const item of features) {
    const key = `${item.name}:${item.value}`;
    if (keySet.has(key)) {
      continue;
    }
    keySet.add(key);
    result.push(item);
  }
  return result;
}

function parseFeaturesFromText(text: string): DetectedFeature[] {
  const features: DetectedFeature[] = [];
  const normalized = normalizeText(text);

  const diaRegex = /(?:ø|phi|diam(?:eter)?|d)\s*([0-9]+(?:\.[0-9]+)?)/gi;
  for (const match of normalized.matchAll(diaRegex)) {
    const numeric = Number(match[1]);
    features.push({
      name: "External Diameter",
      value: `Ø${match[1]}`,
      numericValue: numeric,
      unit: "mm"
    });
  }

  const lengthRegex = /(?:^|\s)([0-9]{1,4}(?:\.[0-9]+)?)\s*mm(?:\s|$)/gi;
  for (const match of normalized.matchAll(lengthRegex)) {
    const numeric = Number(match[1]);
    if (numeric >= 4) {
      features.push({
        name: "Length",
        value: `${match[1]} mm`,
        numericValue: numeric,
        unit: "mm"
      });
    }
  }

  const radiusRegex = /\br\s*([0-9]+(?:\.[0-9]+)?)/gi;
  for (const match of normalized.matchAll(radiusRegex)) {
    features.push({
      name: "Radius",
      value: `R${match[1]}`,
      numericValue: Number(match[1]),
      unit: "mm"
    });
  }

  const chamferRegex = /([0-9]+(?:\.[0-9]+)?)\s*x\s*(45|30|60)/gi;
  for (const match of normalized.matchAll(chamferRegex)) {
    features.push({
      name: "Chamfer",
      value: `${match[1]}x${match[2]}°`,
      numericValue: Number(match[1]),
      unit: "deg"
    });
  }

  const threadRegex = /\bm\s*([0-9]+(?:\.[0-9]+)?)\s*x\s*([0-9]+(?:\.[0-9]+)?)/gi;
  for (const match of normalized.matchAll(threadRegex)) {
    features.push({
      name: "Thread",
      value: `M${match[1]}x${match[2]}`,
      numericValue: Number(match[2]),
      unit: "pitch"
    });
  }

  const roughnessRegex = /\bra\s*([0-9]+(?:\.[0-9]+)?)/gi;
  for (const match of normalized.matchAll(roughnessRegex)) {
    features.push({
      name: "Roughness",
      value: `Ra ${match[1]}`,
      numericValue: Number(match[1]),
      unit: "text"
    });
  }

  if (/\bgroove|канав/i.test(normalized)) {
    features.push({ name: "Groove", value: "Detected text marker", unit: "text" });
  }
  if (/\bhole|отв|drill/i.test(normalized)) {
    features.push({ name: "Hole", value: "Detected text marker", unit: "text" });
  }
  if (/\bcone|конус|taper/i.test(normalized)) {
    features.push({ name: "Taper", value: "Detected text marker", unit: "text" });
  }

  return uniqueFeatures(features);
}

async function analyzeImage(buffer: Buffer): Promise<string> {
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(buffer);
    return result.data.text ?? "";
  } finally {
    await worker.terminate();
  }
}

async function analyzePdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return parsed.text ?? "";
  } finally {
    await parser.destroy();
  }
}

function analyzeDxf(buffer: Buffer): string {
  const DxfParserClass = (
    DxfParserModule as unknown as { default?: new () => { parseSync: (s: string) => unknown }; DxfParser?: new () => { parseSync: (s: string) => unknown } }
  ).default ?? (DxfParserModule as unknown as { DxfParser?: new () => { parseSync: (s: string) => unknown } }).DxfParser;
  if (!DxfParserClass) {
    return "";
  }
  const parser = new DxfParserClass();
  const dxf = parser.parseSync(buffer.toString("utf8")) as { entities?: Array<{ type?: string; text?: string }> } | null;
  if (!dxf) {
    return "";
  }
  const textEntities = (dxf?.entities ?? []).filter(
    (entity: { type?: string }) => entity.type === "TEXT" || entity.type === "MTEXT"
  );
  return textEntities.map((entity) => entity.text ?? "").join(" ");
}

function analyzeStep(buffer: Buffer): string {
  const content = buffer.toString("utf8");
  const candidates: string[] = [];
  const annotationRegex = /'(.*?)'/g;
  for (const match of content.matchAll(annotationRegex)) {
    if (match[1].length > 1 && /[a-z0-9]/i.test(match[1])) {
      candidates.push(match[1]);
    }
  }
  return candidates.join(" ");
}

export async function analyzeDrawing(uploads: UploadArtifact[]): Promise<DrawingAnalysis> {
  let aggregatedText = "";

  for (const upload of uploads) {
    const buffer = bufferFromUpload(upload);
    let text = "";
    if (upload.kind === "image") {
      text = await analyzeImage(buffer);
    } else if (upload.kind === "pdf") {
      text = await analyzePdf(buffer);
    } else if (upload.kind === "dxf") {
      text = analyzeDxf(buffer);
    } else if (upload.kind === "step") {
      text = analyzeStep(buffer);
    }
    aggregatedText += ` ${text}`;
  }

  const features = parseFeaturesFromText(aggregatedText);
  return {
    aggregatedText: normalizeText(aggregatedText),
    features
  };
}
