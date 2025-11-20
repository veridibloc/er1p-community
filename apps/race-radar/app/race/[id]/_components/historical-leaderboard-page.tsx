import {HistoricalLeaderboard} from "@/components/leaderboard";
import {fetchHistoricalLeaderboard} from "./actions.ts";

/*
This is ISR...
We fetch the data from the database and re-render the once a day (if requested)
We do once a day, because it may happen that ranking changes after race due to result reviews
 */

export const revalidate = 24 * 60 * 60;

interface Props {
    raceId: string;
}

export async function HistoricalLeaderboardPage({raceId}: Props) {
    const leaderboard = await fetchHistoricalLeaderboard(raceId);

    return <HistoricalLeaderboard leaderboard={leaderboard}/>
}
