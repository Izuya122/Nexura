export type AnalysisResult = {
  main_subject: string;
  secondary_elements: string;
  environment: string;
  lighting: string;
  camera_angle: string;
  depth_of_field: string;
  texture_details: string;
  mood: string;
  color_grading: string;
  style_reference: string;
  full_prompt: string;
  quality_tags: string;
};

const FIELDS: (keyof AnalysisResult)[] = [
  "main_subject",
  "secondary_elements",
  "environment",
  "lighting",
  "camera_angle",
  "depth_of_field",
  "texture_details",
  "mood",
  "color_grading",
  "style_reference",
  "full_prompt",
  "quality_tags",
];

const SYSTEM_PROMPT = `You are an expert visual analyst and prompt engineer for AI image models (Midjourney, DALL-E, Stable Diffusion).

Analyze the provided image deeply and return ONLY a valid JSON object with these exact string fields:
main_subject, secondary_elements, environment, lighting, camera_angle, depth_of_field, texture_details, mood, color_grading, style_reference, full_prompt, quality_tags.

Rules:
- All fields must be non-empty strings.
- main_subject: detailed physical description of the main subject.
- secondary_elements: other notable elements.
- environment: setting/background.
- lighting: type + direction + intensity.
- camera_angle: angle/perspective.
- depth_of_field: focus/bokeh.
- texture_details: surfaces/materials.
- mood: emotional tone.
- color_grading: palette/grading.
- style_reference: artistic/cinematic style.
- full_prompt: complete optimized image generation prompt, minimum 80 words, standalone usable. Incorporate the requested aspect ratio as a parameter (e.g. --ar 16:9) when an aspect ratio is provided.
- quality_tags: comma-separated quality tags like "8K, ultra-detailed, hyperrealistic, professional lighting, sharp focus".

Never leave fields empty. If uncertain, infer logically but keep realistic. No markdown inside JSON. Return valid JSON only.`;

function cleanJson(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    t = t.slice(first, last + 1);
  }
  return t;
}

function normalize(raw: unknown, aspectRatio: string): AnalysisResult {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const result = {} as AnalysisResult;
  for (const f of FIELDS) {
    const v = obj[f];
    result[f] = typeof v === "string" && v.trim() ? v.trim() : "";
  }
  // fill empties
  if (!result.main_subject) result.main_subject = "A detailed primary subject centered in the frame with realistic proportions and natural presence.";
  if (!result.secondary_elements) result.secondary_elements = "Supporting background details and subtle environmental accents.";
  if (!result.environment) result.environment = "A well-defined real-world setting with coherent spatial depth.";
  if (!result.lighting) result.lighting = "Soft directional lighting with balanced intensity and gentle shadows.";
  if (!result.camera_angle) result.camera_angle = "Eye-level perspective with a natural, immersive viewpoint.";
  if (!result.depth_of_field) result.depth_of_field = "Moderate depth of field with sharp subject and softly blurred background.";
  if (!result.texture_details) result.texture_details = "Fine surface textures with realistic material detail.";
  if (!result.mood) result.mood = "Calm, cinematic, and visually engaging.";
  if (!result.color_grading) result.color_grading = "Natural color grading with balanced contrast and subtle warmth.";
  if (!result.style_reference) result.style_reference = "Professional cinematic photography style.";
  if (!result.quality_tags) result.quality_tags = "8K, ultra-detailed, hyperrealistic, professional lighting, sharp focus";
  if (!result.full_prompt) {
    result.full_prompt = `${result.main_subject} ${result.secondary_elements} ${result.environment} ${result.lighting} ${result.camera_angle} ${result.depth_of_field} ${result.texture_details} ${result.mood} ${result.color_grading} ${result.style_reference} ${result.quality_tags} --ar ${aspectRatio}`;
  }
  // ensure aspect ratio present
  if (aspectRatio && !result.full_prompt.includes(`--ar ${aspectRatio}`)) {
    result.full_prompt = `${result.full_prompt.trim()} --ar ${aspectRatio}`;
  }
  // ensure min 80 words
  if (result.full_prompt.split(/\s+/).length < 80) {
    result.full_prompt = `${result.full_prompt} Rendered with meticulous attention to detail, realistic textures, accurate lighting, professional composition, high dynamic range, and crisp focus suitable for premium AI image generation.`;
  }
  return result;
}

export function getGeminiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_GENAI_API_KEY
  );
}

export function availableProviders(): string[] {
  const out: string[] = [];
  if (process.env.OPENAI_API_KEY) out.push("openai");
  if (process.env.ANTHROPIC_API_KEY) out.push("anthropic");
  if (getGeminiKey()) out.push("gemini");
  if (process.env.GROQ_API_KEY) out.push("groq");
  return out;
}

async function callOpenAI(imageDataUrl: string, aspectRatio: string, modelHint?: string): Promise<AnalysisResult> {
  const key = process.env.OPENAI_API_KEY!;
  const model = modelHint || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this image. Requested aspect ratio: ${aspectRatio}. Return JSON only.` },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      temperature: 0.4,
      max_tokens: 1200,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  return normalize(JSON.parse(cleanJson(content)), aspectRatio);
}

async function callGroq(imageDataUrl: string, aspectRatio: string): Promise<AnalysisResult> {
  const key = process.env.GROQ_API_KEY!;
  const model = "llama-3.2-11b-vision-instruct";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this image. Requested aspect ratio: ${aspectRatio}. Return JSON only.` },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      temperature: 0.4,
      max_tokens: 1200,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  return normalize(JSON.parse(cleanJson(content)), aspectRatio);
}

async function callAnthropic(imageDataUrl: string, aspectRatio: string): Promise<AnalysisResult> {
  const key = process.env.ANTHROPIC_API_KEY!;
  // extract base64 + media type
  const m = imageDataUrl.match(/^data:(.+?);base64,(.+)$/);
  const mediaType = m ? m[1] : "image/jpeg";
  const b64 = m ? m[2] : imageDataUrl;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
            { type: "text", text: `Analyze this image. Requested aspect ratio: ${aspectRatio}. Return JSON only.` },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data?.content?.[0]?.text ?? "";
  return normalize(JSON.parse(cleanJson(content)), aspectRatio);
}

async function callGemini(imageDataUrl: string, aspectRatio: string): Promise<AnalysisResult> {
  const key = getGeminiKey()!;
  const m = imageDataUrl.match(/^data:(.+?);base64,(.+)$/);
  const mediaType = m ? m[1] : "image/jpeg";
  const b64 = m ? m[2] : imageDataUrl;
  const model = "gemini-3.8-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: SYSTEM_PROMPT + `\n\nAnalyze this image. Requested aspect ratio: ${aspectRatio}. Return JSON only.` },
            { inlineData: { mimeType: mediaType, data: b64 } },
          ],
        },
      ],
      generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return normalize(JSON.parse(cleanJson(content)), aspectRatio);
}

export async function analyzeImage(imageDataUrl: string, aspectRatio: string): Promise<{ provider: string; result: AnalysisResult }> {
  // try providers in priority order
  const providers: Array<[string, () => Promise<AnalysisResult>]> = [];
  if (process.env.OPENAI_API_KEY) providers.push(["openai", () => callOpenAI(imageDataUrl, aspectRatio)]);
  if (process.env.ANTHROPIC_API_KEY) providers.push(["anthropic", () => callAnthropic(imageDataUrl, aspectRatio)]);
  if (getGeminiKey()) providers.push(["gemini", () => callGemini(imageDataUrl, aspectRatio)]);
  if (process.env.GROQ_API_KEY) providers.push(["groq", () => callGroq(imageDataUrl, aspectRatio)]);

  if (providers.length === 0) {
    throw new Error("No AI provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY/GEMINI_API_KEY, or GROQ_API_KEY.");
  }

  let lastErr: unknown;
  for (const [name, fn] of providers) {
    try {
      const result = await fn();
      return { provider: name, result };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("All providers failed");
}

export async function enhancePrompt(prompt: string): Promise<string> {
  const sys = "You are an expert prompt engineer. Improve the given prompt for AI image generation: add detail, lighting, camera, style, quality tags. Return only the improved prompt text, no markdown.";
  // use first available text provider
  if (process.env.OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: sys }, { role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 600,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? prompt;
  }
  if (process.env.GROQ_API_KEY) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: sys }, { role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 600,
      }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? prompt;
  }
  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 600,
        system: sys,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = await res.json();
    return data?.content?.[0]?.text?.trim() ?? prompt;
  }
  if (getGeminiKey()) {
    const key = getGeminiKey()!;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: sys + "\n\n" + prompt }] }],
        generationConfig: { temperature: 0.5 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? prompt;
  }
  throw new Error("No AI provider configured.");
}
