import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";
export const maxDuration = 30;

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
  const n = Number(value.replace(/[$,\s]/g, ""));
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
  const normalized = text.replace(/\u00a0/g, " ");

  const patterns = [
    /Net\s*Freight\s*Charges[\s\S]{0,150}?(?:USD\s*)?\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/i,
    /Total\s*Cost[\s\S]{0,150}?(?:USD\s*)?\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/i,
    /Total\s*Carrier\s*Pay[\s\S]{0,150}?(?:USD\s*)?\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/i,
    /Carrier\s*Pay[\s\S]{0,150}?(?:USD\s*)?\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/i,
    /Line\s*Haul[\s\S]{0,150}?(?:USD\s*)?\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/i,
    /Rate[\s\S]{0,80}?(?:USD\s*)?\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const rate = cleanMoney(match?.[1]);
    if (rate && rate > 0) return rate;
  }

  const moneyMatches = [...normalized.matchAll(/(?:USD\s*)?\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/gi)]
    .map((m) => cleanMoney(m[1]))
    .filter((n): n is number => Boolean(n && n >= 100 && n <= 50000));

  return moneyMatches.length ? Math.max(...moneyMatches) : undefined;
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
  if (!loadNumber) warnings.push("Could not confidently find the load number.");
  if (!broker) warnings.push("Could not confidently find the broker.");

  return {
    loadNumber,
    broker,
    rate,
    equipmentType,
    rawTextPreview: normalized.slice(0, 3000),
    warnings,
  };
}

function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Parser timed out.")), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "V1 parser only supports text-based PDFs. OCR for images/scans comes later." },
        { status: 400 }
      );
    }

    // Keep parser from hanging on giant/weird broker packets.
    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: "PDF is too large for the V1 parser. Try a smaller/text-based RC or add OCR later." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const parsed = await timeout(pdfParse(buffer), 15000);

    if (!parsed.text || parsed.text.trim().length < 20) {
      return NextResponse.json(
        { error: "This PDF did not contain readable text. It may be scanned/image-only. OCR will be needed." },
        { status: 400 }
      );
    }

    return NextResponse.json({ parsed: parseRateCon(parsed.text) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not parse rate confirmation.";
    return NextResponse.json(
      { error: message === "Parser timed out." ? "Parser timed out. This PDF may be scanned or too complex for V1 parsing." : "Could not parse rate confirmation." },
      { status: 500 }
    );
  }
}
