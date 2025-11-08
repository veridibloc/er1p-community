
export interface Race {
    id: string;
    name: string;
    description: string;
    directorId: string;
    latitude: number;
    longitude: number;
    dateTime: Date;
    maxParticipants: number;
    lengthKilometer: number;
    durationMinutes: number;
    checkpoints: Checkpoint[];
    imageLogoUrl: string;
    bannerLogoUrl: string;
    isPending?: true;
    director?: string;
    status?:
        | "planned"
        | "started"
        | "stopped"
        | "ended"
        | "cancelled"
        | "resumed"
        | null;
}

export const CheckpointStartId = "s";
export const CheckpointFinishId = "f";

export interface Checkpoint {
    id: string | typeof CheckpointStartId | typeof CheckpointFinishId;
    name: string;
    latitude: number;
    longitude: number;
    distanceKilometer: number; // relative to track length
    cutoffTimeInMinutes: number; // relative to start date time
    elevationGain: number;
    elevationLoss: number;
    elevation: number;
    type: "split" | "in" | "out";
}

export type CheckpointAction = "continue" | "give_up" | "disqualified";
