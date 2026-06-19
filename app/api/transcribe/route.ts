import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY server environment variable." },
        { status: 500 }
      );
    }

    const incomingForm = await request.formData();
    const audio = incomingForm.get("audio");
    const language = String(incomingForm.get("language") || "").trim();

    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "Missing audio file." }, { status: 400 });
    }

    const model = process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo";
    const groqForm = new FormData();
    groqForm.append("file", audio, audio instanceof File ? audio.name : "speech.webm");
    groqForm.append("model", model);
    groqForm.append("response_format", "json");
    if (language) groqForm.append("language", language);

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqForm,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || data?.error || "Groq transcription failed." },
        { status: response.status }
      );
    }

    return NextResponse.json({ text: String(data?.text || "") });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Transcription server error." },
      { status: 500 }
    );
  }
}
