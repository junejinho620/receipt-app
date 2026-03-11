export type TitleDef = { id: string; name: string; description: string; icon: any };

export const AVAILABLE_TITLES: TitleDef[] = [
  { id: "first_ledger", name: "First Note", description: "Record your very first entry.", icon: require('../assets/images/ach_first_ledger.png') },
  { id: "steadfast_auditor", name: "Steadfast Auditor", description: "Record 10 total notes to the archive.", icon: require('../assets/images/ach_steadfast_auditor.png') },
  { id: "receipt_master", name: "Receipt Master", description: "Record 50 total notes to the archive.", icon: require('../assets/images/ach_receipt_master.png') },
  { id: "weekly_warrior", name: "Weekly Warrior", description: "Reach a 7-day contiguous streak.", icon: require('../assets/images/ach_weekly_warrior.png') },
  { id: "early_bird", name: "Early Bird", description: "Submit a log between 4 AM and 8 AM.", icon: require('../assets/images/ach_early_bird.png') },
  { id: "night_owl", name: "Night Owl", description: "Submit a log between Midnight and 4 AM.", icon: require('../assets/images/ach_night_owl.png') },
  { id: "sunday_scaries", name: "Sunday Scaries", description: "Submit your note on a Sunday.", icon: require('../assets/images/ach_sunday_scaries.png') },
  { id: "aesthetic_auditor", name: "Aesthetic Auditor", description: "Submit a receipt with a photo attached.", icon: require('../assets/images/ach_aesthetic_auditor.png') },
  { id: "soundtrack", name: "Soundtrack", description: "Submit a receipt with a song attached.", icon: require('../assets/images/ach_soundtrack.png') },
  { id: "expressive", name: "Expressive", description: "Submit a receipt using a quick emoji.", icon: require('../assets/images/ach_expressive.png') },
];

export function getTitleDef(id: string): TitleDef | undefined {
  return AVAILABLE_TITLES.find(t => t.id === id);
}
