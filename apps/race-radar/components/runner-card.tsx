import Link from "next/link"
import { User, Trophy, Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Runner } from "@/lib/types"

interface RunnerCardProps {
  runner: Runner
}

export function RunnerCard({ runner }: RunnerCardProps) {
  return (
    <Link href={`/runners/${runner.participantId}`}>
      <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg group">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Runner Avatar and Name */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                  {runner.name}
                </h3>
                <p className="text-xs font-mono text-muted-foreground truncate">{runner.participantId}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-center mb-1">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="text-xl font-bold text-foreground">{runner.totalRaces}</div>
                <div className="text-xs text-muted-foreground">Races</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-center mb-1">
                  <Trophy className="h-4 w-4 text-success" />
                </div>
                <div className="text-xl font-bold text-foreground">{runner.completedRaces}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-center mb-1">
                  <Trophy className="h-4 w-4 text-warning" />
                </div>
                <div className="text-xl font-bold text-foreground">{runner.topFinishes}</div>
                <div className="text-xs text-muted-foreground">Top 3</div>
              </div>
            </div>

            {/* View Profile CTA */}
            <div className="pt-2 border-t border-border">
              <div className="text-sm text-primary font-semibold group-hover:translate-x-1 transition-transform inline-block">
                View Profile →
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
