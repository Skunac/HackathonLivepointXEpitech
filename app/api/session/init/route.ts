import { NextRequest, NextResponse } from "next/server";

function generatePseudo() {
    const adjectives = ["Green", "Smart", "Eco", "Fast"];
    const animals = ["Koala", "Tiger", "Falcon", "Otter"];
    return (
        adjectives[Math.floor(Math.random() * adjectives.length)] +
        animals[Math.floor(Math.random() * animals.length)] +
        Math.floor(Math.random() * 1000)
    );
}

export async function GET(req: NextRequest) {
    const pseudoCookie = req.cookies.get("pseudo");
    const pointsCookie = req.cookies.get("points");

    const pseudo = pseudoCookie?.value || generatePseudo();
    const points = pointsCookie?.value || "100";

    const res = new NextResponse(
        JSON.stringify({ session: "created", pseudo, points }),
        {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }
    );

    if (!pseudoCookie) {
        res.cookies.set("pseudo", pseudo, { path: "/", maxAge: 60 * 60 * 24 * 7 });
    }
    if (!pointsCookie) {
        res.cookies.set("points", points, { path: "/", maxAge: 60 * 60 * 24 * 7 });
    }

    return res;
}
