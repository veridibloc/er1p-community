import { NextRequest, NextResponse } from "next/server";
import { fetchLiveLeaderboard } from "@/app/race/[id]/_components/actions";

// Revalidate cached response every 10 seconds
export const revalidate = 10;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const leaderboard = await fetchLiveLeaderboard(id);

    return NextResponse.json(leaderboard, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
