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

const SYSTEM_PROMPT = `You are an expert visual analyst and AI image prompt engineer.

The uploaded image is a STYLE REFERENCE IMAGE.

Your job is to analyze the uploaded image and create a detailed image-generation
prompt that captures its transferable visual characteristics.

IMPORTANT:

The uploaded image is a STYLE REFERENCE, NOT an identity reference.

The person shown in the uploaded image should NOT be treated as the person who
must appear in the final generated image.

Do not instruct another image-generation model to copy, reproduce, or preserve
the identity of the person in the reference image.

Instead, extract the visual characteristics that can be applied to a different
person or subject when the generated prompt is later used together with another
input image.

==================================================
WHAT TO ANALYZE
==================================================

Analyze the uploaded image for transferable visual characteristics, including:

- hairstyle
- hair color
- hair arrangement
- clothing
- clothing style
- clothing colors
- clothing materials
- accessories
- pose
- body positioning
- hand positioning
- generic facial expression
- camera angle
- camera perspective
- camera height
- framing
- composition
- subject placement
- lighting
- light direction
- light softness
- shadows
- highlights
- background
- environment
- depth of field
- background blur
- lens characteristics
- photography style
- cinematic characteristics
- color palette
- color grading
- contrast
- saturation
- image texture
- image quality
- atmosphere
- mood

==================================================
IDENTITY PROTECTION
==================================================

Do NOT transfer the identity of the person shown in the reference image.

Do NOT describe or reproduce:

- exact facial identity
- unique facial structure
- exact facial proportions
- exact eyes
- exact nose
- exact lips
- distinctive facial characteristics
- unique facial marks
- identity-specific features

Do not write instructions such as:

"copy the person's face"

"use the same face"

"recreate the person"

"make the subject look exactly like the reference"

"preserve the person's identity"

Instead, describe only transferable visual characteristics.

Generic characteristics are allowed when they are relevant to the style.

For example:

"soft neutral expression"

"gentle smile"

"slightly serious expression"

"confident expression"

These should remain generic and should not attempt to recreate the
specific person's identity.

==================================================
MAIN SUBJECT
==================================================

main_subject:

Describe the subject in a generic and transferable way.

Focus on:

- subject type
- approximate age category when visually relevant
- general presentation
- hairstyle
- clothing
- pose
- expression

Do not identify the specific person.

Do not describe unique facial characteristics.

==================================================
SECONDARY ELEMENTS
==================================================

Describe:

- accessories
- props
- objects
- furniture
- environmental details
- decorative elements
- other visible supporting elements

Only include elements that are visually relevant.

==================================================
ENVIRONMENT
==================================================

Describe:

- location type
- background
- surroundings
- architecture
- studio environment
- outdoor environment
- spatial arrangement

==================================================
LIGHTING
==================================================

Describe:

- light source
- direction
- softness
- intensity
- highlights
- shadows
- contrast
- ambient illumination
- cinematic lighting characteristics

==================================================
CAMERA
==================================================

Describe:

- camera angle
- camera height
- perspective
- framing
- shot type
- subject distance
- composition
- lens characteristics when visually inferable

==================================================
DEPTH OF FIELD
==================================================

Describe:

- foreground focus
- subject focus
- background blur
- bokeh
- depth separation
- overall sharpness

==================================================
TEXTURE DETAILS
==================================================

Describe transferable realistic textures such as:

- hair texture
- clothing texture
- fabric
- skin texture in a generic photographic sense
- environmental surfaces
- material details

Do not use texture descriptions to recreate identity.

==================================================
MOOD
==================================================

Describe the emotional atmosphere and overall visual feeling.

Examples:

- elegant
- cinematic
- youthful
- dramatic
- calm
- energetic
- luxurious
- nostalgic
- editorial

==================================================
COLOR GRADING
==================================================

Describe:

- dominant colors
- color palette
- saturation
- contrast
- highlights
- shadows
- white balance
- tonal characteristics
- cinematic color treatment

==================================================
STYLE REFERENCE
==================================================

Describe the overall visual style of the reference image.

Focus on:

- photographic style
- editorial style
- cinematic style
- realism
- composition
- visual atmosphere
- image processing
- color treatment
- overall aesthetic

The style reference should be transferable to another person or subject.

==================================================
FULL PROMPT
==================================================

Create a detailed, standalone image-generation prompt based on the visual
characteristics of the uploaded reference image.

The prompt will later be used together with a DIFFERENT INPUT PHOTO by another
image-generation AI.

Therefore, the generated prompt must describe the desired transformation
without assuming that the person in the reference image is the final subject.

The prompt should communicate:

"Apply the visual style, hairstyle, clothing, pose, expression, composition,
camera angle, lighting, environment and photographic aesthetic of the reference
image to the subject provided separately."

Do NOT mention "Photo B".

Do NOT mention "another photo".

Do NOT mention internal analysis instructions.

Do NOT describe the identity of the reference person.

Do NOT instruct the image generator to copy the reference person's face.

The final prompt should be natural and ready to paste directly into another
AI image-generation system.

==================================================
QUALITY
==================================================

quality_tags:

Return useful quality characteristics such as:

- high resolution
- highly detailed
- realistic
- natural texture
- sharp focus
- professional photography
- cinematic lighting
- realistic materials
- detailed environment

Only include quality tags that are appropriate for the reference image.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Use exactly these fields:

{
  "main_subject": "",
  "secondary_elements": "",
  "environment": "",
  "lighting": "",
  "camera_angle": "",
  "depth_of_field": "",
  "texture_details": "",
  "mood": "",
  "color_grading": "",
  "style_reference": "",
  "full_prompt": "",
  "quality_tags": ""
}

All fields must contain useful information.

Do not return Markdown.

Do not return code fences.

Do not add explanations outside the JSON.

The uploaded image is a STYLE REFERENCE ONLY.

Extract its visual language and transferable characteristics,
not the identity of the person shown in it.`;

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
  const model = modelHint || "gpt-6-luna";
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
  const model = "llama-3.2-90b-vision-preview";
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
