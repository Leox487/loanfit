import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  extractJsonFromAssistantText,
  getLoanAnalysisSystemPrompt,
  normalizeLoanAnalysis,
  type LoanAnalysis,
} from "@/lib/analysis-types";
import { createAnalysis } from "@/lib/db";

export const runtime = "nodejs";

const MODEL = "claude-sonnet-4-6";
const MAX_PDF_BYTES = 15 * 1024 * 1024;

const DOCUMENT_SLOTS = [
  { formKey: "bankStatement", label: "Bank Statement" },
  { formKey: "profitLoss", label: "Profit & Loss" },
  { formKey: "taxReturn", label: "Tax Return" },
] as const;

type UploadedDocument = {
  label: string;
  fileName: string;
  base64: string;
};

async function readPdfFromForm(
  form: FormData,
  formKey: string,
): Promise<UploadedDocument | null> {
  const entry = form.get(formKey);
  if (entry === null || entry === undefined) return null;
  if (!(entry instanceof File) || entry.size === 0) return null;

  if (entry.type !== "application/pdf") {
    throw new Error(`INVALID_PDF:${formKey}`);
  }

  const buf = Buffer.from(await entry.arrayBuffer());
  if (buf.byteLength > MAX_PDF_BYTES) {
    throw new Error(`TOO_LARGE:${formKey}`);
  }

  const label =
    DOCUMENT_SLOTS.find((s) => s.formKey === formKey)?.label ?? formKey;

  return {
    label,
    fileName: entry.name || `${formKey}.pdf`,
    base64: buf.toString("base64"),
  };
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

  const documents: UploadedDocument[] = [];

  try {
    for (const slot of DOCUMENT_SLOTS) {
      const doc = await readPdfFromForm(form, slot.formKey);
      if (doc) documents.push(doc);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("INVALID_PDF:")) {
      return NextResponse.json(
        { error: "Only PDF uploads are supported" },
        { status: 400 },
      );
    }
    if (msg.startsWith("TOO_LARGE:")) {
      return NextResponse.json(
        { error: "Each PDF must be 15MB or smaller" },
        { status: 400 },
      );
    }
    throw e;
  }

  if (documents.length === 0) {
    return NextResponse.json(
      { error: "Upload at least one PDF document" },
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

  const content: Anthropic.Messages.MessageCreateParams["messages"][0]["content"] =
    [];

  for (const doc of documents) {
    content.push({
      type: "text",
      text: `--- Document type: ${doc.label} (${doc.fileName}) ---`,
    });
    content.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: doc.base64,
      },
      title: `${doc.label} — ${doc.fileName}`,
    });
  }

  const docList = documents.map((d) => d.label).join(", ");
  content.push({
    type: "text",
    text: `You have received ${documents.length} document(s): ${docList}. Cross-reference all documents where possible — especially revenue in bank statements vs. P&L vs. tax returns, and flag any discrepancies as red flags. Respond with ONLY valid JSON matching the schema from your instructions — no markdown, no commentary.`,
  });

  let message;
  try {
    message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: getLoanAnalysisSystemPrompt(),
      messages: [{ role: "user", content }],
    });
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string; error?: unknown };
    console.error(
      "Claude API error:",
      JSON.stringify({ status: err.status, message: err.message, error: err.error }),
    );
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
  const documentType = documents.map((d) => d.label).join(", ");

  let saved: { id: string };
  try {
    saved = await createAnalysis({
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
      full_report: {
        ...analysis,
        score_breakdown: analysis.score_breakdown,
        dscr_calculation: analysis.dscr_calculation,
        document_assessment: analysis.document_assessment,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to save analysis" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: saved.id, ...analysis });
}
