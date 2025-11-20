import {notFound} from "next/navigation"
import {Calendar, Users, MapPin, Shield, TrendingUp} from "lucide-react"
import {Navbar} from "@/components/navbar"
import {LiveIndicator} from "@/components/live-indicator"
import {CheckpointTimeline} from "@/components/checkpoint-timeline"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {formatDistanceToNow} from "date-fns"
import {LiveLeaderboardPage} from "./_components/live-leaderboard-page.tsx";
import {HistoricalLeaderboardPage} from "./_components/historical-leaderboard-page.tsx";
import {getAccountDid} from "@/lib/did.ts";
import {fetchRace}  from "./_components/actions.ts"

const ExplorerUrl = process.env.NEXT_PUBLIC_SIGNUM_EXPLORER
const DidResolverUrl = process.env.NEXT_PUBLIC_DID_RESOLVER

export default async function RaceDetailPage({
                                                 params,
                                             }: {
    params: Promise<{ id: string }>
}) {
    const {id} = await params
    const race = await fetchRace(id)
    if (!race) {
        notFound()
    }

    const raceFlowEvent = race.raceFlowEvents[0] ? race.raceFlowEvents[0] : null
    const isLive = raceFlowEvent?.eventType !== 'race_cancelled' && raceFlowEvent?.eventType !== 'race_ended'
    const particicpantCount = race.participantEvents.filter(event  => event.eventType === 'confirmed').length
    const checkpointCount =  race.checkpoints.length
    return (
        <div className="min-h-screen bg-background">
            <Navbar/>

            {/* Race Header */}
            <section className="relative overflow-hidden border-b border-border">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5"/>
                <div
                    className="absolute inset-0 bg-[url('/mountain-trail-running-landscape.jpg')] bg-cover bg-center opacity-5"/>

                <div className="relative container mx-auto px-4 py-12">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div>
                                <div
                                    className="text-sm font-mono text-muted-foreground mb-2">{race.id}</div>
                                <h1 className="text-4xl md:text-5xl font-black text-foreground text-balance">
                                    {race.name || `Race ${race.id}`}
                                </h1>
                            </div>
                            {isLive && (
                                <div className="px-6 py-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                    <LiveIndicator/>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4"/>
                                <span>Started {formatDistanceToNow(race.dateTime, {addSuffix: true})}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="h-4 w-4"/>
                                <span
                                    className="font-semibold text-foreground">{particicpantCount}</span> participants
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4"/>
                                <span
                                    className="font-semibold text-foreground">{checkpointCount}</span> checkpoints
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content - Leaderboard */}
                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <TrendingUp className="h-6 w-6 text-primary"/>
                                    Live Leaderboard
                                </h2>
                            </div>
                            {isLive
                                ? <LiveLeaderboardPage raceId={race.id} />
                                : <HistoricalLeaderboardPage raceId={race.id} />
                            }
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Checkpoints */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary"/>
                                        Checkpoints
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CheckpointTimeline checkpoints={race.checkpoints}/>
                                </CardContent>
                            </Card>

                            {/* Blockchain Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-primary"/>
                                        Blockchain Verification
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* TODO: Show W3C DID */}
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Race Account</div>
                                        <div
                                            className="font-mono text-xs text-foreground bg-muted px-2 py-1 rounded break-all">
                                            <a href={ExplorerUrl + `/address/${race.id}`} target="_blank" rel="noopener noreferrer">{race.id}</a>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">W3C DID</div>
                                        <div
                                            className="font-mono text-xs text-foreground bg-muted px-2 py-1 rounded break-all">
                                            <a href={DidResolverUrl + `/${getAccountDid(race.id)}`} target="_blank" rel="noopener noreferrer">{getAccountDid(race.id)}</a>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Status</div>
                                        <div className="text-sm font-semibold text-success">✓ Verified on Chain</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
