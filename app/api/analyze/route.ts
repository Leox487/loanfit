import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  extractJsonFromAssistantText,
  getLoanAnalysisSystemPrompt,
  normalizeLoanAnalysis,
  type LoanAnalysis,
} from "@/lib/analysis-types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase";

export const runtime = "nodejs";

const MODEL = "claude-sonnet-4-6";
const MAX_PDF_BYTES = 15 * 1024 * 1024;

const ALLOWED_TYPES = [
  "Bank Statement",
  "Profit & Loss",
  "Tax Return",
] as const;

function isAllowedDocType(v: string): v is (typeof ALLOWED_TYPES)[number] {
  return (ALLOWED_TYPES as readonly string[]).includes(v);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const documentType = form.get("documentType");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
  }

  if (typeof documentType !== "string" || !isAllowedDocType(documentType)) {
    return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "Only PDF uploads are supported" },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.byteLength === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (buf.byteLength > MAX_PDF_BYTES) {
    return NextResponse.json(
      { error: "PDF must be 15MB or smaller" },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server missing ANTHROPIC_API_KEY" },
      { status: 500 },
    );
  }

  const anthropic = new Anthropic({ apiKey });
  const base64 = buf.toString("base64");

  let message;
  try {
    message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: getLoanAnalysisSystemPrompt(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
              title: file.name || "upload.pdf",
            },
            {
              type: "text",
              text: `The borrower labeled this document as: "${documentType}". Respond with ONLY valid JSON matching the schema from your instructions — no markdown, no commentary.`,
            },
          ],
        },
      ],
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Analysis request failed. Try again later." },
      { status: 502 },
    );
  }

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json(
      { error: "Unexpected model response" },
      { status: 502 },
    );
  }

  let parsed: unknown;
  try {
    const rawJson = extractJsonFromAssistantText(textBlock.text);
    parsed = JSON.parse(rawJson);
  } catch {
    return NextResponse.json(
      { error: "Could not parse analysis JSON from model" },
      { status: 502 },
    );
  }

  const analysis: LoanAnalysis = normalizeLoanAnalysis(parsed);

  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return NextResponse.json(
      { error: "Server missing Supabase configuration" },
      { status: 500 },
    );
  }

  const { data: row, error: insertError } = await supabase
    .from("analyses")
    .insert({
      user_id: userId,
      document_type: documentType,
      raw_text: textBlock.text,
      loan_readiness_score: analysis.loan_readiness_score,
      dscr: analysis.dscr,
      revenue_trend: analysis.revenue_trend,
      debt_load: analysis.debt_load,
      cash_flow_consistency: analysis.cash_flow_consistency,
      red_flags: analysis.red_flags,
      fix_list: analysis.fix_list,
      loan_types_qualified: analysis.loan_types_qualified,
      full_report: JSON.stringify(analysis),
    })
    .select("id")
    .single();

  if (insertError || !row?.id) {
    console.error(insertError);
    return NextResponse.json(
      { error: "Failed to save analysis" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: row.id as string, ...analysis });
}
