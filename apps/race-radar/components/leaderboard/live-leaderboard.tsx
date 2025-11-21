"use client"

import {Card, CardContent} from "@/components/ui/card.tsx";
import {formatDistanceToNow} from "date-fns";
import {StatusBadge} from "@/components/status-badge.tsx";
import {type LiveLeaderboard as LiveLeaderboardType} from "@er1p-community/race-indexer-db";
import {LeaderboardTableHeader} from "./leaderboard-table-header";
import {formatDuration, getPositionClasses, isPodiumPosition} from "./types";
import useSWR from "swr";
import {fetchLiveLeaderboard} from "@/app/race/[id]/_components/actions.ts";

interface LiveLeaderboardProps {
    /**
     * The live leaderboard data from the database. It needs to be ordered already (fastest to slowest).
     */
    initialLeaderboard: LiveLeaderboardType[];
    raceId: string;
}


export function LiveLeaderboard({initialLeaderboard, raceId}: LiveLeaderboardProps) {

    const {data: leaderboard = initialLeaderboard} = useSWR<LiveLeaderboardType[]>(
        `live-leader-board-${raceId}`, () =>fetchLiveLeaderboard(raceId),
        {
            fallbackData: initialLeaderboard,
            refreshInterval: 10 * 1000, // Poll every 10 seconds
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
        }
    );

    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <LeaderboardTableHeader/>
                        <tbody>
                        {leaderboard.map((entry, index) => {
                            const position = index + 1;
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
                                                {entry.participantName && <span>{entry.participantName} - </span>}
                                                {entry.bib || "Unknown"}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                {entry.participantId}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="font-semibold text-foreground">
                                            {entry.lastCheckpointId ? `CP ${entry.lastCheckpointId}` : "—"}
                                        </div>
                                        {entry.lastCheckpointTime && (
                                            <div className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(entry.lastCheckpointTime, {addSuffix: true})}
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
