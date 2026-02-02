export interface OnboardingSlide {
  icon: string;
  title: string;
  description: string;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    icon: '🧾',
    title: 'Settle the Books',
    description:
      'Your day is a series of transactions.\nClose the tab on your day with a single, raw entry that proves you were here.',
  },
  {
    icon: '📸',
    title: 'Any Format, Under 60 Seconds',
    description:
      'Capturing a memory shouldn\'t feel like homework. Drop in a photo, your current favorite song, or a quick thought. \nIf it happened today, it\'s a valid receipt.',
  },
  {
    icon: '🎞️',
    title: 'Your Life on Tape',
    description:
      'Watch your history unfold on a continuous, scrollable "register tape." \nScroll back through your weeks and months in a tactile, visual index.',
  },
];
