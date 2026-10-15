/** Each evidence rating's badge colours, written out in full for Tailwind's scanner. */
export const EVIDENCE_BADGE = {
  lab: "bg-evidence-lab-fill text-evidence-lab",
  early: "bg-evidence-early-fill text-evidence-early",
  mixed: "bg-evidence-mixed-fill text-evidence-mixed",
  moderate: "bg-evidence-moderate-fill text-evidence-moderate",
  "not-supported": "bg-evidence-none-fill text-evidence-none",
} as const;

/** Section eyebrow and heading, as About's sections set them. */
export const eyebrowClass = "font-poppins text-[0.75rem] leading-4 font-semibold tracking-[0.1875rem] uppercase";
export const headingClass =
  "mt-3 font-display text-[clamp(2rem,4.4vw,3rem)] leading-[1.08] font-bold tracking-[-0.5px] text-balance";
