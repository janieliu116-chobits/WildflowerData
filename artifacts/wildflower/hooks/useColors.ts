import colors from '@/constants/colors';

/**
 * Wildflower is a dark-only app.
 * Always returns the dark design tokens regardless of system color scheme.
 */
export function useColors() {
  return { ...colors.dark, radius: colors.radius };
}
