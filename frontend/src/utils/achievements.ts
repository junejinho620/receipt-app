export type TitleDef = { id: string; name: string; description: string; emoji: string };

export const AVAILABLE_TITLES: TitleDef[] = [
  { id: "first_ledger", name: "First Ledger", description: "Submit your very first receipt.", emoji: "🌱" },
  { id: "steadfast_auditor", name: "Steadfast Auditor", description: "Submit 10 total logs to the ledger.", emoji: "🛡️" },
  { id: "receipt_master", name: "Receipt Master", description: "Submit 50 total logs to the ledger.", emoji: "👑" },
  { id: "weekly_warrior", name: "Weekly Warrior", description: "Reach a 7-day contiguous streak.", emoji: "🔥" },
  { id: "early_bird", name: "Early Bird", description: "Submit a log between 4 AM and 8 AM.", emoji: "🌅" },
  { id: "night_owl", name: "Night Owl", description: "Submit a log between Midnight and 4 AM.", emoji: "🦉" },
  { id: "sunday_scaries", name: "Sunday Scaries", description: "Settle your ledger on a Sunday.", emoji: "👻" },
  { id: "aesthetic_auditor", name: "Aesthetic Auditor", description: "Submit a receipt with a photo attached.", emoji: "📸" },
  { id: "soundtrack", name: "Soundtrack", description: "Submit a receipt with a song attached.", emoji: "🎵" },
  { id: "expressive", name: "Expressive", description: "Submit a receipt using a quick emoji.", emoji: "😊" },
];

export function getTitleDef(id: string): TitleDef | undefined {
  return AVAILABLE_TITLES.find(t => t.id === id);
}
