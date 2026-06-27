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
        "anthropic-beta": "pdfs-2024-09-25",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [{
          role: "user",
          content: [
            contentBlock,
            {
              type: "text",
              text: `Extract invoice data from this document. Return ONLY a valid JSON object — no markdown, no explanation, no trailing text.

Schema:
{"supplier":"string","invoiceNumber":"string","invoiceDate":"YYYY-MM-DD","items":[{"description":"string","quantity":number,"unitCost":number,"batchNumber":"string or null","expirationDate":"YYYY-MM-DD or null"}],"freight":number,"additionalCost":number,"invoiceTotal":number}

Field rules:
- freight: shipping/freight/delivery charges only
- additionalCost: any other fees beyond line items and freight
- invoiceTotal: the grand total amount due
- If a non-date field is missing, use "" or 0

batchNumber extraction rules:
- Look for columns or labels named: Batch, Batch No, Batch #, Batch Number, Lot, Lot No, Lot #, Lot Number, Batch/Lot, Code
- Extract the alphanumeric code on the same row as the product
- Return null if no batch/lot code exists for that item

expirationDate extraction rules — apply ALL of the following:
1. Look for columns or labels named: Expiration, Exp, Expiry, Expiry Date, Best Before, Best By, Use By, BB, BB Date, BBD, EXP, EXP Date, Sell By, Valid Until, Valid Thru, Shelf Life
2. Extract the date value on the same row as the product in that column
3. Also check columns adjacent to Batch/Lot columns for a paired date
4. Recognize all date formats and convert to YYYY-MM-DD: DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, DD.MM.YYYY, MMM YYYY, MM/YYYY, YYYY-MM-DD, Month DD YYYY, DD Month YYYY
5. If a date appears without a label but is the only date on a product row, treat it as the expiration date
6. Return null ONLY when no date is visible for that item — do not invent dates`,
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
