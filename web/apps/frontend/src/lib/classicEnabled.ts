/**
 * The original RAND Hedgemony ("classic") mode is gated behind an env flag and
 * is LOCAL STUDY USE ONLY (see ORIGINAL/NOTICE.md). It must never ship in a
 * hosted/production build. Enable locally with NEXT_PUBLIC_ENABLE_CLASSIC=1.
 */
export const CLASSIC_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_CLASSIC === "1" ||
  process.env.NEXT_PUBLIC_ENABLE_CLASSIC === "true";
