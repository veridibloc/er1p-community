import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface StatsCardProps {
  icon: ReactNode
  label: string
  value: string | number
  highlight?: boolean
}

export function StatsCard({ icon, label, value, highlight }: StatsCardProps) {
  return (
    <Card className={highlight ? "border-primary bg-primary/5" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-lg ${highlight ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            {icon}
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground">{value}</div>
            <div className="text-sm text-muted-foreground mt-1">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
