"use client"

import {useState} from "react"
import {Trophy, Search} from "lucide-react"
import {RaceCard} from "@/components/race-card"
import {Input} from "@/components/ui/input"
import {type Checkpoint, type Race} from "@er1p-community/race-indexer-db"

interface Props {
    races: (Race & { checkpoints: Checkpoint[] })[]
}

export function History({races}: Props) {
    const [searchQuery, setSearchQuery] = useState("")

    // TODO: once we have a significant amount of data, we need a paginated fetch
    const filteredRaces = races.filter((race) => {
        const query = searchQuery.toLowerCase()
        return (
            race.name?.toLowerCase().includes(query) ||
            race.id.toLowerCase().includes(query)
        )
    })

    return (<section className="container mx-auto px-4 py-16">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="relative max-w-2xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                    <Input
                        type="text"
                        placeholder="Search by race name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-14 text-lg"
                    />
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-foreground">Completed Races</h2>
                    <p className="text-muted-foreground mt-1">
                        {filteredRaces.length} {filteredRaces.length === 1 ? "race" : "races"} found
                    </p>
                </div>

                {filteredRaces.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRaces.map((race) => (
                            <RaceCard key={race.id} race={race}/>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="inline-block p-6 rounded-full bg-secondary mb-4">
                            <Trophy className="h-12 w-12 text-muted-foreground"/>
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">No Races Found</h3>
                        <p className="text-muted-foreground">Try adjusting your search criteria</p>
                    </div>
                )}
            </div>
        </section>
    )
}
