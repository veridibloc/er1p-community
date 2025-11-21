// Shared types and utilities for leaderboard components

export interface LeaderboardRowData {
  participantId: string;
  participantName: string | null;
  bib: string | null;
  lastCheckpointTime: Date | null;
  raceDurationSeconds: number | null;
  status: "racing" | "finished" | "dnf" | "disqualified";
}

export interface PositionStyleProps {
  position: number;
  isPodium: boolean;
}

/**
 * Format seconds to HH:MM:SS
 */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--:--";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get position styling classes
 */
export function getPositionClasses(position: number): string {
  if (position === 1) return "text-accent";
  if (position === 2) return "text-muted-foreground";
  if (position === 3) return "text-warning";
  return "text-foreground";
}

/**
 * Check if position is podium (top 3)
 */
export function isPodiumPosition(position: number): boolean {
  return position <= 3;
}
