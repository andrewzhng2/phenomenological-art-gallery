export type TextSignals = {
  caption?: string;
  ocrText?: string;
  keywords: string[];
};

function toKeywords(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => s.length >= 3)
    .slice(0, 50);
}

/**
 * Best-effort "magic" extraction that stays free:
 * - Caption the painting photo using an open-source browser model (downloads on first use).
 * - Optionally OCR any visible label text (also downloads assets on first use).
 */
export async function extractTextSignals(
  file: File,
  opts?: { doOcr?: boolean }
): Promise<TextSignals> {
  if (typeof window === 'undefined') {
    // Prevent accidental SSR invocation
    return { keywords: [] };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    // Image caption
    let caption: string | undefined;
    try {
      const { env, pipeline } = await import('@xenova/transformers');
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      // Small-ish caption model; still a noticeable first download.
      const captioner = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning');
      const out = (await captioner(objectUrl)) as Array<{ generated_text?: string }>;
      caption = out?.[0]?.generated_text?.trim() || undefined;
    } catch {
      caption = undefined;
    }

    // OCR (optional)
    let ocrText: string | undefined;
    if (opts?.doOcr) {
      try {
        const Tesseract = await import('tesseract.js');
        const res = await Tesseract.recognize(objectUrl, 'eng');
        ocrText = res?.data?.text?.trim() || undefined;
      } catch {
        ocrText = undefined;
      }
    }

    const keywords = [
      ...(caption ? toKeywords(caption) : []),
      ...(ocrText ? toKeywords(ocrText) : [])
    ];

    return {
      caption,
      ocrText,
      keywords: Array.from(new Set(keywords))
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}


