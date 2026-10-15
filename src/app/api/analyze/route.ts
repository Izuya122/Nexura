import { NextResponse } from "next/server";
import { db } from "@/db";
import { generations } from "@/db/schema";
import { analyzeImage } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const image = body?.image as string | undefined;
    const aspectRatio = (body?.aspectRatio as string) || "1:1";
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "image is required" }, { status: 400 });
    }
    const { provider, result } = await analyzeImage(image, aspectRatio);

    // thumbnail: downscale not possible server-side easily; store trimmed data url (cap size)
    const thumbnail = image.length > 200000 ? image.slice(0, 200000) : image;

    try {
      await db.insert(generations).values({
        mode: "image-to-prompt",
        aspectRatio,
        thumbnail,
        mainSubject: result.main_subject,
        secondaryElements: result.secondary_elements,
        environment: result.environment,
        lighting: result.lighting,
        cameraAngle: result.camera_angle,
        depthOfField: result.depth_of_field,
        textureDetails: result.texture_details,
        mood: result.mood,
        colorGrading: result.color_grading,
        styleReference: result.style_reference,
        fullPrompt: result.full_prompt,
        qualityTags: result.quality_tags,
        jsonOutput: result as unknown as Record<string, unknown>,
      });
    } catch (dbErr) {
      // don't fail request if db unavailable
      console.error("db insert failed", dbErr);
    }

    return NextResponse.json({ provider, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}