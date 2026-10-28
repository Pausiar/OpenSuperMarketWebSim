export interface CampaignDef {
  id: string;
  name: string;
  costCents: number;
  durationDays: number;
  /** Multiplicador de tráfico mientras dura (1.15 = +15%). */
  trafficBoost: number;
}

export const CAMPAIGNS: CampaignDef[] = [
  {
    id: 'flyers',
    name: 'Buzoneo de folletos',
    costCents: 30_000,
    durationDays: 7,
    trafficBoost: 1.12,
  },
  {
    id: 'social',
    name: 'Campaña en redes',
    costCents: 80_000,
    durationDays: 10,
    trafficBoost: 1.18,
  },
  {
    id: 'radio',
    name: 'Cuña de radio local',
    costCents: 150_000,
    durationDays: 14,
    trafficBoost: 1.25,
  },
  {
    id: 'degustacion',
    name: 'Jornada de degustación',
    costCents: 50_000,
    durationDays: 3,
    trafficBoost: 1.3,
  },
];

export const CAMPAIGN_MAP: Record<string, CampaignDef> = Object.fromEntries(
  CAMPAIGNS.map((c) => [c.id, c]),
);
