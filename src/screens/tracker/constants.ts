export const TRACKER_COLORS = {
  weight: {
    primary: '#0b6bcf',
    completed: '#10b981',
    gradient: ['#0b6bcf', '#10b981'] as const,
    glow: '#10b981',
  },
  water: {
    primary: '#0ea5e9',
    completed: '#06b6d4',
    gradient: ['#0ea5e9', '#06b6d4'] as const,
    glow: '#22d3ee',
  },
  steps: {
    primary: '#f59e0b',
    completed: '#f97316',
    gradient: ['#f59e0b', '#f97316'] as const,
    glow: '#fb923c',
  },
  sleep: {
    primary: '#8b5cf6',
    completed: '#a855f7',
    gradient: ['#8b5cf6', '#a855f7'] as const,
    glow: '#c084fc',
  },
  mood: {
    primary: '#f97316',
    completed: '#22c55e',
    gradient: ['#f97316', '#22c55e'] as const,
    glow: '#4ade80',
  },
  habits: {
    primary: '#0891b2',
    completed: '#14b8a6',
    gradient: ['#0891b2', '#14b8a6'] as const,
    glow: '#2dd4bf',
  },
} as const;

export const GOAL_COMPLETED_COLOR = '#fbbf24';

export const DEFAULT_TARGETS = {
  steps: 10000,
  water: 3000,
  sleep: 8,
  weight: 75,
} as const;

export function getProgressPercentage(
  current: number,
  target: number,
): number {
  if (target <= 0) return 0;
  return Math.min((current / target) * 100, 100);
}

export function getGoalStatus(progress: number): 'incomplete' | 'nearly' | 'complete' {
  if (progress >= 100) return 'complete';
  if (progress >= 80) return 'nearly';
  return 'incomplete';
}

export function getGoalColor(
  baseColor: string,
  completedColor: string,
  progress: number,
): string {
  if (progress >= 100) return completedColor;
  return baseColor;
}
