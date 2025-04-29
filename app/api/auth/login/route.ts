import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { username, password } = await req.json();

    // Auth ultra basique (pas de DB)
    if (username !== "admin" || password !== "1234") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = NextResponse.json({ message: "Logged in" });

    response.cookies.set("auth_token", "dummy-token", {
        httpOnly: true,
        path: "/",
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 jour
    });

    return response;
}
