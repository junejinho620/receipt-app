export interface OnboardingSlide {
  image: any;
  title: string;
  description: string;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    image: require('../assets/images/onboarding_ledger.png'),
    title: 'Settle the Books',
    description:
      'Your day is a series of transactions.\nClose the tab on your day with a single, raw entry that proves you were here.',
  },
  {
    image: require('../assets/images/onboarding_camera.png'),
    title: 'Any Format, Under 60 Seconds',
    description:
      'Capturing a memory shouldn\'t feel like homework. Drop in a photo, your current favorite song, or a quick thought. \nIf it happened today, it\'s a valid receipt.',
  },
  {
    image: require('../assets/images/onboarding_tape.png'),
    title: 'Your Life on Tape',
    description:
      'Watch your history unfold on a continuous, scrollable "register tape." \nScroll back through your weeks and months in a tactile, visual index.',
  },
];
