import {Trophy} from "lucide-react"
import {Navbar} from "@/components/navbar"
import {History} from "@/app/history/_components/history";
import {fetchAllRaces, fetchAllRaceStats} from "./actions"


export default async function HistoryPage() {
    const [races, stats] = await Promise.all([
        fetchAllRaces(),
        fetchAllRaceStats()
    ])

    return (
        <div className="min-h-screen bg-background">
            <Navbar/>

            {/* Hero Section */}
            <section className="relative overflow-hidden border-b border-border">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-primary/5"/>

                <div className="relative container mx-auto px-4 py-16">
                    <div className="max-w-4xl mx-auto text-center space-y-4">
                        <div className="inline-block p-4 rounded-full bg-accent/10 mb-4">
                            <Trophy className="h-12 w-12 text-accent"/>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-foreground text-balance">
                            Race{" "}
                            <span
                                className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-warning">History</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Explore past achievements and relive the moments of triumph
                        </p>

                        <div className="flex items-center justify-center gap-8 pt-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-foreground">{races.length}</div>
                                <div className="text-sm text-muted-foreground">Completed Races</div>
                            </div>
                            <div className="w-px h-12 bg-border"/>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-foreground">
                                    {stats.participantCount}
                                </div>
                                <div className="text-sm text-muted-foreground">Total Participants</div>
                            </div>
                            <div className="w-px h-12 bg-border"/>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-foreground">
                                    {stats.totalFinishers}
                                    <span className="ml-4 text-sm text-muted-foreground">{(stats.totalFinishers/stats.participantCount) * 100}%</span>
                                </div>
                                <div className="text-sm text-muted-foreground">Total Finishers</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Historical Races */}
            <History races={races}/>
        </div>
    )
}
