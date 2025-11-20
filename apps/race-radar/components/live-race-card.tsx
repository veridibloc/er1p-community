import Link from "next/link"
import {Calendar, Users, MapPin} from "lucide-react"
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import {LiveIndicator} from "./live-indicator"
import {formatDistanceToNow} from "date-fns"
import type {LiveRace, Race} from "@er1p-community/race-indexer-db"


interface RaceCardProps {
    liveRace: LiveRace,
}

export function LiveRaceCard({liveRace}: RaceCardProps) {

    return (
        <Link href={`/race/${liveRace.raceId}`}>
            <Card
                className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary via-accent to-warning"/>

                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-mono text-muted-foreground mb-1">{liveRace.raceId}</div>
                            <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors text-balance">
                                {liveRace.name || `Race ${liveRace.raceId}`}
                            </h3>
                        </div>
                        <LiveIndicator/>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4"/>
                            <span>{formatDistanceToNow(liveRace.dateTime, {addSuffix: true})}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2 border-t border-border">
                        <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-semibold text-foreground">{liveRace.participantCount}</span>
                            <span className="text-muted-foreground">runners</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-semibold text-foreground">{liveRace.totalCheckpoints}</span>
                            <span className="text-muted-foreground">checkpoints</span>
                        </div>
                    </div>

                    <div className="pt-3">
                        <div
                            className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-2 rounded-md text-center">
                            View Live Leaderboard →
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
