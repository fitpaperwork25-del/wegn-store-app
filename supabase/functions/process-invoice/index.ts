import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { base64Data, mediaType, isPdf } = await req.json() as {
      base64Data: string;
      mediaType: string;
      isPdf: boolean;
    };

    if (!base64Data || !mediaType) {
      return new Response(JSON.stringify({ error: "base64Data and mediaType are required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY secret not configured" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const contentBlock = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Data } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } };

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            contentBlock,
            {
              type: "text",
              text: 'Extract the invoice data from this document. Return ONLY a valid JSON object — no markdown, no explanation:\n{"supplier":"string","invoiceNumber":"string","invoiceDate":"YYYY-MM-DD","items":[{"description":"string","quantity":number,"unitCost":number}],"freight":number,"additionalCost":number,"invoiceTotal":number}\nfreight = shipping/freight charges. additionalCost = any extra charges/fees beyond line items and freight. invoiceTotal = the grand total amount due. If a field is not found, use an empty string or 0.',
            },
          ],
        }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: `Anthropic API error: ${(err as { error?: { message?: string } }).error?.message ?? anthropicRes.statusText}` }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const data = await anthropicRes.json() as { content: { type: string; text: string }[] };
    const raw = data.content.find((b) => b.type === "text")?.text ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return new Response(JSON.stringify({ error: "Could not parse invoice JSON from API response" }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const invoice = JSON.parse(match[0]);
    return new Response(JSON.stringify(invoice), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
