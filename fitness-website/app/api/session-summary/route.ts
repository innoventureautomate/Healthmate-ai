import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/ai-client";

export async function POST(req: NextRequest) {
  try {
    const session = await req.json();

    const {
      clientName = "the client",
      postureScore,
      alertCount,
      durationSec,
      viewMode,
      neckAngle,
      torsoAngle,
      shoulderDiff,
      date,
    } = session;

    const mins = Math.floor(durationSec / 60);
    const secs = durationSec % 60;
    const durationStr = mins > 0 ? `${mins} minutes ${secs} seconds` : `${secs} seconds`;

    const metricsBlock = [
      neckAngle  ? `- Neck angle: ${neckAngle}° (threshold: <40°, ${neckAngle > 40 ? "EXCEEDED" : "within range"})` : null,
      torsoAngle ? `- Torso angle: ${torsoAngle}° (threshold: <10°, ${torsoAngle > 10 ? "EXCEEDED" : "within range"})` : null,
      shoulderDiff ? `- Shoulder level difference: ${shoulderDiff}px (threshold: ~40px)` : null,
    ].filter(Boolean).join("\n") || "- No angle data captured (front/back view session)";

    const prompt = `You are a physiotherapy AI assistant helping clinicians understand patient posture sessions.

Analyse the following posture session and provide a structured clinical summary.

SESSION DATA:
- Client: ${clientName}
- Date: ${date || "today"}
- Duration: ${durationStr}
- View mode: ${viewMode} view
- Overall posture score: ${postureScore}% (poor <60%, fair 60–79%, good ≥80%)
- Posture alerts triggered: ${alertCount}
${metricsBlock}

Provide a response in this exact format:

**Overall Assessment**
2–3 sentences interpreting the score and session quality in clinical terms.

**Key Findings**
3–4 bullet points on specific posture issues observed, referencing the metrics.

**Risk Indicators**
1–2 bullet points on potential long-term musculoskeletal risks if this posture pattern continues.

**Recommended Exercises**
3 specific exercises the physiotherapist should prescribe next, with brief rationale.

**Provider Notes**
1–2 sentences for the treating physiotherapist to discuss with the patient at next appointment.

Keep the tone professional, concise, and evidence-based. Do not mention AI.`;

    const { text } = await generateAIResponse(prompt);

    return NextResponse.json({ summary: text });
  } catch (err: any) {
    console.error("[session-summary]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
