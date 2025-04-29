import { NextResponse } from "next/server";

function generatePseudo() {
    const adjectives = ["Green", "Smart", "Eco", "Fast"];
    const animals = ["Koala", "Tiger", "Falcon", "Otter"];
    return (
        adjectives[Math.floor(Math.random() * adjectives.length)] +
        animals[Math.floor(Math.random() * animals.length)] +
        Math.floor(Math.random() * 1000)
    );
}

export async function GET() {
    const pseudo = generatePseudo();
    const points = "100";

    const res = new NextResponse(
        JSON.stringify({ session: "created", pseudo, points }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    res.cookies.set("pseudo", pseudo, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 semaine
    });

    res.cookies.set("points", points, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    return res;
}