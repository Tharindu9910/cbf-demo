/**
 * The Gotukola page's copy and data (`/gotukola/`), researched October 2026
 * and condensed to a two-screen summary. Kept apart from the components so it
 * can be reviewed and edited in one place.
 *
 * Every figure comes from a source in `sources`, and each claim names it by
 * id (`cite`). The page is education, not a health claim: keep the evidence
 * ratings honest, and don't strengthen one without a new source.
 */

/** How far the human evidence goes, weakest to strongest. */
export type Evidence = "lab" | "early" | "mixed" | "moderate" | "not-supported";

export const EVIDENCE_LABELS: Record<Evidence, string> = {
  lab: "Lab & animal studies",
  early: "Early human studies",
  mixed: "Mixed human results",
  moderate: "Several human trials",
  "not-supported": "Not supported so far",
};

export const GOTUKOLA = {
  seo: {
    title: "What Is Gotukola (Centella asiatica)? | CFB Sri Lanka",
    description:
      "What Gotukola (gotu kola) is, how Sri Lankans eat it, what's inside the leaf and what research up to 2026 really says about its benefits and safety.",
    image: "/og/about.jpg",
    imageAlt: "Ceylon Future Beverages: Nature. Reimagined.",
  },

  hero: {
    eyebrow: "Know your herb",
    title: "Gotukola. Sri Lanka’s little green leaf.",
    intro:
      "A coin-shaped leaf that grows in every damp corner of the island, on every Sri Lankan plate and in centuries of Ayurveda. Here’s what it is, and what science says today.",
    /** The names it goes by, under the intro. */
    names: [
      { lang: "Sinhala", name: "ගොටුකොළ (Gotukola)" },
      { lang: "Tamil", name: "வல்லாரை (Vallarai)" },
      { lang: "Ayurveda", name: "Mandukaparni" },
      { lang: "Botanical", name: "Centella asiatica" },
    ],
  },

  overview: {
    eyebrow: "The herb in brief",
    title: "A creeping herb with a big reputation.",
    body: "Gotukola is a small perennial herb in the carrot and parsley family. It spreads on thin runners through wet, shaded soil, and in Sri Lanka it is first of all food, one of the island’s most widely eaten green leaves. It is also one of the oldest herbs in Ayurveda, long given as a tonic for the mind, the skin and healing.",
    /** How it's eaten, as chips. */
    dishes: ["Gotukola mallum", "Kola kenda porridge", "Fresh juice", "Sambols & salads"],
    dishesLabel: "On the Sri Lankan table",
    facts: [
      { label: "Botanical name", value: "Centella asiatica (L.) Urb." },
      { label: "Family", value: "Apiaceae (carrot & parsley)" },
      { label: "Grows best in", value: "Low-country wet zone, soil pH 6–7" },
      { label: "From planting to harvest", value: "Under 100 days; harvests for 2–3 years" },
    ],
    factsCite: ["doa"],
    /** The numbers that make it distinctive. */
    stats: [
      { value: "3.2–9.7 mg/g", label: "Madecassoside in dried plant, its main triterpenoid", cite: "razzaq2026" },
      { value: "1.2–8.9 mg/g", label: "Asiaticoside, the best-known compound", cite: "razzaq2026" },
      { value: "6,165 mg", label: "Potassium per 100 g dry weight in Sri Lankan types", cite: "chandrika2011" },
      { value: "74 mg", label: "Iron per 100 g dry weight in the richest type", cite: "chandrika2011" },
    ],
  },

  evidence: {
    eyebrow: "What the science says",
    title: "Promising, but honest about the gaps.",
    findings: [
      {
        topic: "Circulation in the legs",
        evidence: "moderate" as Evidence,
        body: "Less heaviness, pain and swelling in chronic venous insufficiency; many trials were poorly reported.",
        cite: ["chong2013"],
      },
      {
        topic: "Skin & wound healing",
        evidence: "moderate" as Evidence,
        body: "Asiaticoside supports collagen and new blood vessels; better wound and scar healing reported.",
        cite: ["bylka2022"],
      },
      {
        topic: "Mood & alertness",
        evidence: "early" as Evidence,
        body: "More alert and less angry an hour after taking it, in small, short trials.",
        cite: ["puttarak2017"],
      },
      {
        topic: "Memory & thinking",
        evidence: "mixed" as Evidence,
        body: "No clear effect on any area of thinking or memory in a meta-analysis of 11 trials.",
        cite: ["puttarak2017"],
      },
      {
        topic: "Healthy ageing & low mood",
        evidence: "lab" as Evidence,
        body: "Strong lab results in two 2026 reviews, but not yet proven in people.",
        cite: ["nutrients2026", "life2026"],
      },
      {
        topic: "Blood sugar",
        evidence: "not-supported" as Evidence,
        body: "No benefit over placebo for HbA1c, glucose or cholesterol in a 70-adult, six-month trial.",
        cite: ["tawanwongsri2025"],
      },
    ],
    note: "Trials use concentrated, standardised extracts at doses far above a plate of mallum, so results can’t simply be applied to food or drinks.",
    safety: {
      title: "Safety",
      body: "As a leafy vegetable, gotukola has been eaten safely in Sri Lanka for generations. Supplements are usually well tolerated (mild stomach upset, nausea, dizziness), but rare liver injury has been reported with high-dose use, and concentrated extracts aren’t advised in pregnancy or breastfeeding. Check with a doctor if you have liver disease or take regular medicines.",
      cite: ["livertox", "tawanwongsri2025"],
    },
    disclaimer: "General education only. Not medical advice, and gotukola is not a treatment for any disease.",
  },

  /** Cited by id across the page and listed at its foot. */
  sources: {
    puttarak2017: {
      label:
        "Puttarak P. et al. Effects of Centella asiatica (L.) Urb. on cognitive function and mood related outcomes: a systematic review and meta-analysis. Scientific Reports, 2017.",
      href: "https://www.nature.com/articles/s41598-017-09823-9",
    },
    chong2013: {
      label:
        "Chong N.J., Aziz Z. A systematic review of the efficacy of Centella asiatica for improvement of the signs and symptoms of chronic venous insufficiency. Evid. Based Complement. Alternat. Med., 2013.",
      href: "https://onlinelibrary.wiley.com/doi/full/10.1155/2013/627182",
    },
    bylka2022: {
      label: "A systematic review of the effect of Centella asiatica on wound healing. Int. J. Environ. Res. Public Health, 2022.",
      href: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8956065/",
    },
    chandrika2011: {
      label:
        "Chandrika U.G. et al. Carotenoid and mineral content of different morphotypes of Centella asiatica L. (Gotukola). Int. J. Food Sci. Nutr., 2011.",
      href: "https://pubmed.ncbi.nlm.nih.gov/21391792/",
    },
    razzaq2026: {
      label:
        "Razzaq W. et al. Centella asiatica as a model biomass for sustainable production of biochemicals: a comprehensive field-to-market review. Molecules, February 2026.",
      href: "https://doi.org/10.3390/molecules31030526",
    },
    nutrients2026: {
      label: "Geroprotective potential of Centella asiatica: modulation of cellular aging. Nutrients 18(11):1649, May 2026.",
      href: "https://doi.org/10.3390/nu18111649",
    },
    life2026: {
      label:
        "Depression-related mechanistic and translational evidence for Centella asiatica and its triterpenoids: a scoping review. Life 16(8):1345, August 2026.",
      href: "https://doi.org/10.3390/life16081345",
    },
    tawanwongsri2025: {
      label:
        "Tawanwongsri W. et al. Efficacy and safety of Centella asiatica as a dietary supplement for glycemic control and lipid regulation in type 2 diabetes: a randomized controlled trial. Frontiers in Pharmacology, 2025.",
      href: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12689944/",
    },
    livertox: {
      label: "Centella asiatica. LiverTox: Clinical and Research Information on Drug-Induced Liver Injury. US National Institutes of Health.",
      href: "https://www.ncbi.nlm.nih.gov/books/NBK603561/",
    },
    doa: {
      label: "Department of Agriculture, Sri Lanka (HORDI). Gotukola crop recommendations and released varieties.",
      href: "https://doa.gov.lk/hordi-crop-gotukola/",
    },
  } as Record<string, { label: string; href: string }>,
};

/** The sources in the order they're listed, numbered for the in-text citations. */
export const SOURCE_IDS = Object.keys(GOTUKOLA.sources);
export const sourceNumber = (id: string) => SOURCE_IDS.indexOf(id) + 1;
