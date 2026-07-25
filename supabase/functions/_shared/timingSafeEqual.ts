/**
 * Constant-time shared-secret comparison for Deno Edge Functions - see the
 * Phase 1 security audit's L-1 finding. Plain `===`/`!==` on a secret
 * short-circuits at the first differing byte, which leaks a timing signal
 * an attacker can use to guess the secret one byte at a time.
 *
 * Hand-rolled rather than importing Node's `crypto.timingSafeEqual` via a
 * `node:crypto` specifier: Supabase's edge runtime is Deno-based but not
 * guaranteed to support every Node built-in the same way `deno run` does
 * locally, and this needs zero external dependencies to behave predictably
 * once actually deployed. XOR-accumulate every byte instead of comparing
 * and branching, so the number of operations depends only on length, never
 * on where (or whether) the strings differ.
 *
 * A length mismatch still does a same-cost dummy comparison before
 * returning false, so "wrong length" doesn't return measurably faster than
 * "right length, wrong content".
 */
export function secureCompare(a: string, b: string): boolean {
  const bufA = new TextEncoder().encode(a);
  const bufB = new TextEncoder().encode(b);

  if (bufA.length !== bufB.length) {
    xorAccumulate(bufA, bufA);
    return false;
  }

  return xorAccumulate(bufA, bufB) === 0;
}

function xorAccumulate(x: Uint8Array, y: Uint8Array): number {
  let diff = 0;
  for (let i = 0; i < x.length; i++) {
    diff |= x[i] ^ y[i];
  }
  return diff;
}
