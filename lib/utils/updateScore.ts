import { NextRequest, NextResponse } from "next/server";

/**
 * Récupère le pseudo et les points à partir du cookie
 */
export function getSessionData(req: NextRequest) {
    const points = req.cookies.get("points")?.value || "100";
    const pseudo = req.cookies.get("pseudo")?.value || "Unknown";

    return { pseudo, points: parseInt(points, 10) };
}

/**
 * Met à jour les points dans les cookies
 */
export function updatePointsResponse(req: NextRequest, delta: number): NextResponse {
    const currentPoints = parseInt(req.cookies.get("points")?.value || "100", 10);
    const updatedPoints = Math.max(0, currentPoints + delta);

    const response = NextResponse.json({ updated: updatedPoints });

    response.cookies.set("points", updatedPoints.toString(), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    return response;
}
