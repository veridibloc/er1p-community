import {
    Activity,
    Users,
    Shield,
    FootprintsIcon,
    ActivityIcon,
    TimerIcon,
    MountainSnowIcon
} from "lucide-react"
import {StatsCard} from "@/components/stats-card"

import {fetchLiveRaces, fetchOverallRaceStats} from "./actions"
import {LiveRaceCard} from "@/components/live-race-card.tsx";
import {formatTime} from "@/lib/format-time.ts";
import {cn} from "@/lib/utils.ts";
import {PageContent} from "@/components/page-content.tsx";

export default async function HomePage() {
    const [liveRaces, raceStats] = await Promise.all([
        fetchLiveRaces(),
        fetchOverallRaceStats()])

    const liveDistances = liveRaces.reduce((acc, race) => acc + race.race.lengthKilometer, 0);
    const liveParticipants = liveRaces.reduce((sum, race) => sum + (race.participantCount), 0);

    const totalRaces = raceStats.racesCount + liveRaces.length;
    const totalRunners = liveParticipants + raceStats.totalParticipants
    const totalDistance = liveDistances + raceStats.totalDistanceKilometer
    const totalTime = raceStats.totalTrackedTimeSeconds

    return (
        <PageContent>
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10"/>
                <div
                    className="absolute inset-0 bg-[url('/trail-runners-in-mountains-action-shot.jpg')] bg-cover bg-center dark:opacity-10 opacity-30"/>

                <div className="relative container mx-auto px-4 py-24">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <h1 className="text-5xl md:text-7xl font-black text-foreground text-balance leading-tight">
                            Track{" "}
                            <span
                                className="text-transparent bg-clip-text bg-gradient-to-r from-primary dark:via-accent via-black to-warning">
                Every Race
              </span>{" "}
                            in Real-Time
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                            Live endurance race tracking with blockchain-verified results. Follow marathons,
                            ultra-trails, and
                            ultra-marathons as they happen.
                        </p>
                        <div className="flex items-center justify-center gap-4 pt-4">
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-full dark:bg-primary/10 bg-primary/50 border border-primary/20">
                                <Shield className="h-4 w-4 dark:text-primary text-secondary"/>
                                <span className="text-sm font-semibold dark:text-primary text-secondary">100% Blockchain Verified</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Dashboard */}
            <section className="container mx-auto px-4 -mt-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatsCard
                        icon={<ActivityIcon className={cn("h-6 w-6", liveRaces.length && "animate-ping")}/>}
                        label="Active Races Now"
                        value={liveRaces.length}
                        highlight
                    />
                    <StatsCard
                        icon={<MountainSnowIcon className="h-6 w-6"/>}
                        label="Overall Races"
                        value={totalRaces}
                    />
                    <StatsCard
                        icon={<FootprintsIcon className="h-6 w-6"/>}
                        label="Overall Tracked Distance"
                        value={totalDistance.toFixed(2) + ' km'}
                    />
                    <StatsCard
                        icon={<TimerIcon className="h-6 w-6"/>}
                        label="Overall Tracked Time"
                        value={formatTime(totalTime)}
                    />
                    <StatsCard
                        icon={<Users className="h-6 w-6"/>}
                        label="Overall Runners"
                        value={totalRunners}
                    />

                </div>
            </section>

            {/* Active Races Section */}
            <section className="container mx-auto px-4 py-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground">Live Races</h2>
                        <p className="text-muted-foreground mt-1">Follow the action in real-time</p>
                    </div>
                </div>

                {liveRaces.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {liveRaces.map((liveRace) => (
                            <LiveRaceCard key={liveRace.raceId} liveRace={liveRace}/>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="inline-block p-6 rounded-full bg-secondary mb-4">
                            <Activity className="h-12 w-12 text-muted-foreground"/>
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">No Active Races</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Check back soon for live race tracking. In the meantime, explore our race history.
                        </p>
                    </div>
                )}
            </section>
        </PageContent>
    )
}
