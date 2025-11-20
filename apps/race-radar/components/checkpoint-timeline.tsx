import { Flag, MapPin, FlagTriangleRight as FlagTriangledRight } from "lucide-react"
import {Checkpoint} from "@er1p-community/race-indexer-db"
interface CheckpointTimelineProps {
  checkpoints: Checkpoint[]
}

export function CheckpointTimeline({ checkpoints }: CheckpointTimelineProps) {

    checkpoints.sort((a, b) => a.orderIndex - b.orderIndex)

    return (
    <div className="space-y-1">
      {checkpoints.map((checkpoint, index) => {
        const isStart = checkpoint.checkpointId === "s"
        const isFinish = checkpoint.checkpointId === "f"

        return (
          <div key={checkpoint.id} className="relative">
            <div className="flex items-start gap-3">
              <div className="relative flex flex-col items-center">
                <div
                  className={`
                  flex items-center justify-center w-8 h-8 rounded-full
                  ${isStart ? "bg-success text-success-foreground" : ""}
                  ${isFinish ? "bg-accent text-accent-foreground" : ""}
                  ${!isStart && !isFinish ? "bg-primary text-primary-foreground" : ""}
                `}
                >
                  {isStart && <Flag className="h-4 w-4" />}
                  {isFinish && <FlagTriangledRight className="h-4 w-4" />}
                  {!isStart && !isFinish && <MapPin className="h-4 w-4" />}
                </div>
                {!isFinish && <div className="w-0.5 h-8 bg-border mt-1" />}
              </div>

              <div className="flex-1 pb-6">
                <div className="font-semibold text-foreground">{checkpoint.name}</div>
                <div className="text-xs text-muted-foreground font-mono mt-1">
                  {checkpoint.latitude.toFixed(4)}°, {checkpoint.longitude.toFixed(4)}°
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
