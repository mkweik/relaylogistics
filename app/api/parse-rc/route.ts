import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

type ParsedRateCon = {
  loadNumber?: string;
  broker?: string;
  rate?: number;
  equipmentType?: string;
  rawTextPreview?: string;
  warnings: string[];
};

function cleanMoney(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function firstMatch(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function parseRate(text: string): number | undefined {
  const patterns = [
    /Net\s+Freight\s+Charges\s+(?:USD\s*)?\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /Total\s+Cost\s+(?:USD\s*)?\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /Total\s+Carrier\s+Pay\s*:?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /Carrier\s+Pay\s*:?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /Line\s+Haul\s*:?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
    /Rate\s*:?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const rate = cleanMoney(match?.[1]);
    if (rate && rate > 0) return rate;
  }

  return undefined;
}

function parseRateCon(text: string): ParsedRateCon {
  const warnings: string[] = [];
  const normalized = text.replace(/\u00a0/g, " ");

  const loadNumber = firstMatch(normalized, [
    /Load\s+Number\s*:?\s*([A-Z0-9-]+)/i,
    /Load\s*#\s*:?\s*([A-Z0-9-]+)/i,
    /Carrier\s+Rate\s+Confirmation\s*:?\s*([A-Z0-9-]+)/i,
  ]);

  const broker = firstMatch(normalized, [
    /Broker\s+Contact\s+Information\s*\n\s*([^\n]+)/i,
    /^([A-Z][A-Za-z0-9 &.,'-]+)\s*\n\s*(?:PO Box|P\.O\. Box|\d{2,})/m,
  ]);

  const equipmentType = firstMatch(normalized, [
    /Equipment\s+Type\s*:?\s*([^\n]+)/i,
    /Equipment\s*:?\s*([^\n]+)/i,
  ]);

  const rate = parseRate(normalized);
  if (!rate) warnings.push("Could not confidently find the rate. Check the actual rate manually.");

  return {
    loadNumber,
    broker,
    rate,
    equipmentType,
    rawTextPreview: normalized.slice(0, 2500),
    warnings,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "V1 parser only supports text-based PDFs. OCR for images/scans comes later." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdfParse(buffer);

    if (!parsed.text || parsed.text.trim().length < 20) {
      return NextResponse.json({ error: "This PDF did not contain readable text. It may be scanned. OCR will be needed." }, { status: 400 });
    }

    return NextResponse.json({ parsed: parseRateCon(parsed.text) });
  } catch {
    return NextResponse.json({ error: "Could not parse rate confirmation." }, { status: 500 });
  }
}
