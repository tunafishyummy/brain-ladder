import { Text as NativeText, type TextProps } from 'react-native';

/** Keeps larger system text settings readable without letting fixed UI labels grow without bound. */
export default function AdaptiveText({ maxFontSizeMultiplier = 1.5, ...props }: TextProps) {
  return <NativeText {...props} maxFontSizeMultiplier={maxFontSizeMultiplier} />;
}
