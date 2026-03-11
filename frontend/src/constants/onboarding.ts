export interface OnboardingSlide {
  image: any;
  title: string;
  description: string;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    image: require('../assets/images/onboarding_ledger.png'),
    title: 'One Thought a Day',
    description:
      'Leave the noise behind. Jot down a quick thought, a mood, or simply how your day went.',
  },
  {
    image: require('../assets/images/onboarding_camera.png'),
    title: 'Express It Your Way',
    description:
      'Some days need words, others just need a photo or a song. Record your day however feels right.',
  },
  {
    image: require('../assets/images/onboarding_tape.png'),
    title: 'Your Life on Tape',
    description:
      'See your days collect into a piece of your story. Scroll back through a calm, visual timeline of your life.',
  },
];
