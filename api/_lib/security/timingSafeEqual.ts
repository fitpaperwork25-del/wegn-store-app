import { timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";

/**
 * Constant-time shared-secret comparison for this app's Node-side (Vercel
 * API route) handlers - see the Phase 1 security audit's L-1 finding.
 * Plain `===`/`!==` on a secret short-circuits at the first differing
 * byte, which leaks a timing signal an attacker can use to guess the
 * secret one byte at a time. Node's own `crypto.timingSafeEqual` is the
 * standard fix, but it throws on mismatched-length buffers rather than
 * returning false - guarded here so callers get a plain boolean.
 *
 * A length mismatch is handled by still doing a same-cost dummy compare
 * before returning false, so "wrong length" doesn't return measurably
 * faster than "right length, wrong content" (the length of a fixed,
 * server-configured secret isn't the sensitive part - its content is -
 * but this keeps the function's timing profile uniform regardless).
 */
export function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  if (bufA.length !== bufB.length) {
    // Same-cost dummy comparison against a buffer of a's own length, so
    // this branch takes roughly the same time as the equal-length path.
    nodeTimingSafeEqual(bufA, bufA);
    return false;
  }

  return nodeTimingSafeEqual(bufA, bufB);
}
