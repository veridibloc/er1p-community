import Link from "next/link"
import {Calendar, Users, MapPin, Route} from "lucide-react"
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import {formatDistanceToNow} from "date-fns"
import type {Checkpoint, Race} from "@er1p-community/race-indexer-db"


interface RaceCardProps {
    race: Race & { checkpoints: Checkpoint[] },
}

export function RaceCard({race}: RaceCardProps) {

    return (
        <Link href={`/race/${race.id}`}>
            <Card
                className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary via-accent to-warning"/>

                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-mono text-muted-foreground mb-1">{race.id.toUpperCase()}</div>
                            <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors text-balance">
                                {race.name || `Race ${race.id}`}
                            </h3>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4"/>
                            <span>{formatDistanceToNow(race.dateTime, {addSuffix: true})}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2 border-t border-border flex-wrap">
                        <div className="flex items-center gap-2 text-sm">
                            <Route className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-semibold text-foreground">{race.lengthKilometer}</span>
                            <span className="text-muted-foreground">km</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-semibold text-foreground">{race.maxParticipants}</span>
                            <span className="text-muted-foreground">runners</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground"/>
                            <span className="font-semibold text-foreground">{race.checkpoints.length}</span>
                            <span className="text-muted-foreground">checkpoints</span>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </Link>
    )
}
