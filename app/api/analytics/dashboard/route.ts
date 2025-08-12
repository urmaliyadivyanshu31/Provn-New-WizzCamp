import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")
    const timeframe = searchParams.get("timeframe") || "30d"

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 })
    }

    // Mock analytics data - in real app would aggregate from database
    const mockAnalytics = {
      overview: {
        totalEarnings: 167.5,
        totalViews: 4240,
        totalTips: 85,
        totalLicenses: 9,
        totalVideos: 4,
        growthMetrics: {
          earningsGrowth: 8.3, // percentage
          viewsGrowth: 12.5,
          tipsGrowth: 5.2,
          licensesGrowth: 15.7,
        },
      },
      recentActivity: [
        {
          type: "tip",
          amount: "5 wCAMP",
          video: "Creative Dance Routine",
          from: "0x9876...5432",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          type: "license",
          amount: "10 wCAMP",
          video: "Urban Art Tutorial",
          from: "0x5678...9012",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      topPerforming: [
        {
          id: "3",
          title: "Cooking Experiment",
          views: 2100,
          earnings: 92.0,
          performance: "excellent",
        },
        {
          id: "1",
          title: "Creative Dance Routine",
          views: 1250,
          earnings: 47.5,
          performance: "good",
        },
      ],
      earningsBreakdown: {
        fromTips: 62.5, // 85 tips * average 2.5 wCAMP
        fromLicenses: 63.0, // 9 licenses * 7 wCAMP (70% share)
        fromRoyalties: 42.0, // derivative royalties
        total: 167.5,
      },
      timeSeriesData: {
        // Mock daily data for charts
        views: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          value: Math.floor(Math.random() * 200) + 50,
        })),
        earnings: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          value: Math.random() * 10 + 2,
        })),
      },
    }

    return NextResponse.json(mockAnalytics)
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
