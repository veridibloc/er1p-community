import { notFound } from "next/navigation"
import { User, Trophy, Calendar, Activity } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getRunnerById } from "@/lib/mock-data"

interface RunnerDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function RunnerDetailPage({ params }: RunnerDetailPageProps) {
  const { id } = await params
  const runner = getRunnerById(id)

  if (!runner) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Runner Profile Header */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />

        <div className="relative container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Profile Info */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-8">
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User className="h-12 w-12 text-white" />
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <h1 className="text-3xl md:text-5xl font-black text-foreground">{runner.name}</h1>
                <p className="text-sm font-mono text-muted-foreground break-all">Account ID: {runner.participantId}</p>
                <p className="text-xs font-mono text-muted-foreground break-all">
                  Public Key: {runner.participantPublicKey}
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{runner.totalRaces}</div>
                      <div className="text-sm text-muted-foreground">Total Races</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <Trophy className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{runner.completedRaces}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Trophy className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{runner.topFinishes}</div>
                      <div className="text-sm text-muted-foreground">Top 3 Finishes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Calendar className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">{runner.currentStreak}</div>
                      <div className="text-sm text-muted-foreground">Race Streak</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Racing History */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Racing History</h2>
            <p className="text-muted-foreground mt-1">Complete race participation record</p>
          </div>

          <div className="space-y-4">
            {runner.raceHistory.map((historyItem) => (
              <Card key={historyItem.raceId} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Race Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-foreground">{historyItem.raceName}</h3>
                        <Badge variant={historyItem.status === "finished" ? "default" : "secondary"}>
                          {historyItem.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(historyItem.raceDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Race Stats */}
                    <div className="flex gap-6 md:gap-8">
                      {historyItem.position && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">#{historyItem.position}</div>
                          <div className="text-xs text-muted-foreground">Position</div>
                        </div>
                      )}
                      {historyItem.timeElapsed && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">{historyItem.timeElapsed}</div>
                          <div className="text-xs text-muted-foreground">Time</div>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {historyItem.lastCheckpointSequence + 1}
                        </div>
                        <div className="text-xs text-muted-foreground">Checkpoints</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {runner.raceHistory.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-block p-6 rounded-full bg-secondary mb-4">
                <Activity className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">No Race History</h3>
              <p className="text-muted-foreground">This runner has not participated in any races yet</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
