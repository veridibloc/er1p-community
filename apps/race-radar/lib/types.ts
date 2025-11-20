

export interface Runner {
  participantId: string
  participantPublicKey: string
  name: string
  totalRaces: number
  completedRaces: number
  topFinishes: number
  currentStreak: number
  raceHistory: RaceHistoryItem[]
}

export interface RaceHistoryItem {
  raceId: string
  raceName: string
  raceDate: Date
  position?: number
  timeElapsed?: string
  lastCheckpointSequence: number
  status: "finished" | "racing" | "dnf" | "disqualified"
}
