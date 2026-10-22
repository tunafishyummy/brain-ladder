const GENERIC_WOODFRAMES = {
  '4to3': require('../../assets/images/Languagewoodframe4to3.png'),
  '4to1': require('../../assets/images/Languagewoodframe4to1.png'),
  '6to1': require('../../assets/images/Languagewoodframe6to1.png'),
};

const LEVEL_WOODFRAMES: Record<string, Partial<typeof GENERIC_WOODFRAMES>> = {
  reading: {
    '4to3': require('../../assets/images/Languagewoodframe4to3.png'),
    '4to1': require('../../assets/images/Languagewoodframe4to1.png'),
    '6to1': require('../../assets/images/Languagewoodframe6to1.png'),
  },
  research: {
    '4to3': require('../../assets/images/Sciencewoodframe4to3.png'),
    '4to1': require('../../assets/images/Sciencewoodframe4to1.png'),
    '6to1': require('../../assets/images/Sciencewoodframe6to1.png'),
  },
  collections: {
    '4to3': require('../../assets/images/Historywoodframe4to3.png'),
    '4to1': require('../../assets/images/Historywoodframe4to1.png'),
    '6to1': require('../../assets/images/Historywoodframe6to1.png'),
  },
};

export function getWoodframeSource(
  level: string | string[] | undefined,
  ratio: keyof typeof GENERIC_WOODFRAMES,
) {
  const levelId = Array.isArray(level) ? level[0] : level;
  return LEVEL_WOODFRAMES[levelId ?? '']?.[ratio] ?? GENERIC_WOODFRAMES[ratio];
}
