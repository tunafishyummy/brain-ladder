export const LOGO_LAYOUT = {
  stackWidth: '50%' as const,
  stackAspectRatio: 2,
  layers: {
    lad: {
      left: '55%' as const,
      top: '100%' as const,
      scale: 1.3,
    },
    brainLadder: {
      left: '-2%' as const,
      top: '80%' as const,
      scale: 1.7,
    },
    adder: {
      left: '-45%' as const,
      top: '30%' as const,
      scale: 1.6,
    },
  },
} as const;
//lad snake ladder place thing adjust