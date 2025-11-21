import { Card, CardContent } from "@/components/ui/card.tsx";
import { format } from "date-fns";
import { StatusBadge } from "@/components/status-badge.tsx";
import { type HistoricalLeaderboard as HistoricalLeaderboardType } from "@er1p-community/race-indexer-db";
import { LeaderboardTableHeader } from "./leaderboard-table-header";
import { formatDuration, getPositionClasses, isPodiumPosition } from "./types";

interface HistoricalLeaderboardProps {
  leaderboard: HistoricalLeaderboardType[];
}

export function HistoricalLeaderboard({ leaderboard }: HistoricalLeaderboardProps) {

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <LeaderboardTableHeader />
            <tbody>
              {leaderboard.map((entry) => {
                const position = entry.finalRank ?? leaderboard.indexOf(entry) + 1;
                const isPodium = isPodiumPosition(position);

                return (
                  <tr
                    key={entry.participantId}
                    className={`
                      border-b border-border last:border-0 hover:bg-muted/30 transition-colors
                      ${isPodium ? "bg-gradient-to-r from-accent/5 to-transparent" : ""}
                    `}
                  >
                    <td className="py-4 px-4">
                      <div className={`font-bold text-lg ${getPositionClasses(position)}`}>
                        {position}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-semibold text-foreground">
                          {entry.participantName || entry.bib || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {entry.participantId}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-foreground">
                        CP {entry.checkpointsCompleted}
                      </div>
                      {entry.lastCheckpointTime && (
                        <div className="text-xs text-muted-foreground">
                          {format(entry.lastCheckpointTime, "MMM d, HH:mm")}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-mono font-semibold text-foreground">
                        {formatDuration(entry.raceDurationSeconds)}
                      </div>
                      {entry.paceSecondsPerKm && (
                        <div className="text-xs text-muted-foreground">
                          {formatDuration(Math.round(entry.paceSecondsPerKm))}/km
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge
                        isFinished={entry.status === "finished"}
                        isDisqualified={entry.status === "disqualified"}
                        didNotFinish={entry.status === "dnf"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
