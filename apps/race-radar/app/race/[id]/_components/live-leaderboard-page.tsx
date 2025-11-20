import {LiveLeaderboard} from "@/components/leaderboard";
import {fetchLiveLeaderboard} from "./actions"

interface Props {
    raceId: string;
}

export async function LiveLeaderboardPage({raceId}: Props) {
    const initialData = await fetchLiveLeaderboard(raceId);
    return <LiveLeaderboard raceId={raceId} initialLeaderboard={initialData}/>
}
