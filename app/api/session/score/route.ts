import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const points = req.cookies.get("points")?.value || "100";
    const pseudo = req.cookies.get("pseudo")?.value || "Unknown";

    return NextResponse.json({ pseudo, points });
}

export async function POST(req: NextRequest) {
    const { delta } = await req.json(); // exemple : { delta: -10 }

    const current = parseInt(req.cookies.get("points")?.value || "100", 10);
    const updated = Math.max(0, current + delta);

    const res = NextResponse.json({ updated });

    res.cookies.set("points", updated.toString(), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    return res;
}
