import type {Runner} from "./types"

export const mockRunners: Runner[] = [
    {
        participantId: "p-001",
        participantPublicKey: "ERaa7X3...m2Pp8",
        name: "Sarah Chen",
        totalRaces: 8,
        completedRaces: 7,
        topFinishes: 4,
        currentStreak: 3,
        raceHistory: [
            {
                raceId: "race-001",
                raceName: "Alpine Ultra Trail 100K",
                raceDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
                position: 1,
                timeElapsed: "2:47:23",
                lastCheckpointSequence: 6,
                status: "racing",
            },
            {
                raceId: "race-003",
                raceName: "Coastal Ultra 50 Miles",
                raceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                position: 2,
                timeElapsed: "4:12:45",
                lastCheckpointSequence: 7,
                status: "finished",
            },
            {
                raceId: "race-004",
                raceName: "Mountain Peak Marathon",
                raceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                position: 1,
                timeElapsed: "3:05:18",
                lastCheckpointSequence: 7,
                status: "finished",
            },
        ],
    },
    {
        participantId: "p-002",
        participantPublicKey: "ERbb9K1...n5Qq2",
        name: "Marcus Rodriguez",
        totalRaces: 12,
        completedRaces: 10,
        topFinishes: 6,
        currentStreak: 5,
        raceHistory: [
            {
                raceId: "race-001",
                raceName: "Alpine Ultra Trail 100K",
                raceDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
                position: 2,
                timeElapsed: "2:49:41",
                lastCheckpointSequence: 6,
                status: "racing",
            },
            {
                raceId: "race-003",
                raceName: "Coastal Ultra 50 Miles",
                raceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                position: 1,
                timeElapsed: "4:08:22",
                lastCheckpointSequence: 7,
                status: "finished",
            },
        ],
    },
    {
        participantId: "p-003",
        participantPublicKey: "ERcc2M8...k7Rr9",
        name: "Emma Thompson",
        totalRaces: 6,
        completedRaces: 5,
        topFinishes: 3,
        currentStreak: 2,
        raceHistory: [
            {
                raceId: "race-001",
                raceName: "Alpine Ultra Trail 100K",
                raceDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
                position: 3,
                timeElapsed: "2:51:15",
                lastCheckpointSequence: 6,
                status: "racing",
            },
        ],
    },
    {
        participantId: "p-004",
        participantPublicKey: "ERdd5P4...x2Ss3",
        name: "James Wilson",
        totalRaces: 15,
        completedRaces: 14,
        topFinishes: 5,
        currentStreak: 7,
        raceHistory: [
            {
                raceId: "race-001",
                raceName: "Alpine Ultra Trail 100K",
                raceDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
                position: 4,
                timeElapsed: "2:53:48",
                lastCheckpointSequence: 5,
                status: "racing",
            },
            {
                raceId: "race-004",
                raceName: "Mountain Peak Marathon",
                raceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                position: 3,
                timeElapsed: "3:18:55",
                lastCheckpointSequence: 7,
                status: "finished",
            },
        ],
    },
    {
        participantId: "p-005",
        participantPublicKey: "ERee8T1...m4Tt6",
        name: "Olivia Martinez",
        totalRaces: 9,
        completedRaces: 8,
        topFinishes: 4,
        currentStreak: 4,
        raceHistory: [
            {
                raceId: "race-001",
                raceName: "Alpine Ultra Trail 100K",
                raceDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
                position: 5,
                timeElapsed: "2:56:22",
                lastCheckpointSequence: 5,
                status: "racing",
            },
        ],
    },
    {
        participantId: "p-006",
        participantPublicKey: "ERff3K7...n8Uu1",
        name: "Daniel Kim",
        totalRaces: 11,
        completedRaces: 9,
        topFinishes: 2,
        currentStreak: 3,
        raceHistory: [
            {
                raceId: "race-001",
                raceName: "Alpine Ultra Trail 100K",
                raceDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
                position: 6,
                timeElapsed: "2:58:55",
                lastCheckpointSequence: 5,
                status: "racing",
            },
            {
                raceId: "race-003",
                raceName: "Coastal Ultra 50 Miles",
                raceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                position: 8,
                timeElapsed: "4:45:33",
                lastCheckpointSequence: 7,
                status: "finished",
            },
        ],
    },
    {
        participantId: "p-007",
        participantPublicKey: "ERgg1M2...k3Vv4",
        name: "Sophie Anderson",
        totalRaces: 7,
        completedRaces: 6,
        topFinishes: 3,
        currentStreak: 2,
        raceHistory: [
            {
                raceId: "race-001",
                raceName: "Alpine Ultra Trail 100K",
                raceDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
                position: 7,
                timeElapsed: "3:01:33",
                lastCheckpointSequence: 4,
                status: "racing",
            },
        ],
    },
    {
        participantId: "p-008",
        participantPublicKey: "ERhh6P9...x6Ww7",
        name: "Ryan Foster",
        totalRaces: 10,
        completedRaces: 9,
        topFinishes: 1,
        currentStreak: 4,
        raceHistory: [
            {
                raceId: "race-001",
                raceName: "Alpine Ultra Trail 100K",
                raceDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
                position: 8,
                timeElapsed: "3:04:18",
                lastCheckpointSequence: 4,
                status: "racing",
            },
            {
                raceId: "race-004",
                raceName: "Mountain Peak Marathon",
                raceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                position: 12,
                timeElapsed: "3:42:09",
                lastCheckpointSequence: 7,
                status: "finished",
            },
        ],
    },
]


export function getAllRunners(): Runner[] {
    return mockRunners
}

export function getRunnerById(id: string): Runner | null {
    return mockRunners.find((runner) => runner.participantId === id) || null
}

export function searchRunners(query: string): Runner[] {
    const lowerQuery = query.toLowerCase()
    return mockRunners.filter(
        (runner) =>
            runner.name.toLowerCase().includes(lowerQuery) ||
            runner.participantId.toLowerCase().includes(lowerQuery) ||
            runner.participantPublicKey.toLowerCase().includes(lowerQuery),
    )
}
