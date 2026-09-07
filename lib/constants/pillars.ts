export type PillarCode =
  | "TECHNOLOGY"
  | "DIGITAL_ECONOMY"
  | "ENTERTAINMENT"
  | "ARTS"
  | "TOURISM";

export interface Pillar {
  code: PillarCode;
  name: string;
  description: string;
}

/** Must match public.pillars.code in the database exactly. */
export const PILLARS: Pillar[] = [
  {
    code: "TECHNOLOGY",
    name: "Technology",
    description:
      "AI, software, robotics, infrastructure, startups and innovation.",
  },
  {
    code: "DIGITAL_ECONOMY",
    name: "Digital Economy",
    description:
      "Cryptocurrency, blockchain and digital economic experimentation.",
  },
  {
    code: "ENTERTAINMENT",
    name: "Entertainment",
    description: "Film, video, gaming, events, music, experiences.",
  },
  {
    code: "ARTS",
    name: "Arts",
    description:
      "Artists, designers, musicians, writers, filmmakers, architects.",
  },
  {
    code: "TOURISM",
    name: "Tourism",
    description:
      "Hospitality, experiences, travel, events, culture, future destinations.",
  },
];

export function pillarByCode(code: string | null | undefined) {
  return PILLARS.find((p) => p.code === code);
}

export function pillarName(code: string | null | undefined) {
  return pillarByCode(code)?.name ?? code ?? "";
}
