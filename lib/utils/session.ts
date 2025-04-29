import { cookies } from "next/headers";

/**
 * Récupère le pseudo et les points à partir des cookies
 */
export async function getSessionData() {
    const store = await cookies(); // ✅ await ici

    const pointsCookie = store.get("points")?.value;
    const pseudoCookie = store.get("pseudo")?.value;

    const points = pointsCookie ? parseInt(pointsCookie, 10) : 100;
    const pseudo = pseudoCookie || "Unknown";

    return { pseudo, points };
}

/**
 * Met à jour les points et les stocke dans les cookies
 */
export async function updateSessionPoints(delta: number) {
    const store = await cookies(); // ✅ await ici

    const pointsCookie = store.get("points")?.value;
    const currentPoints = pointsCookie ? parseInt(pointsCookie, 10) : 100;

    const updatedPoints = Math.max(0, currentPoints + delta);

    store.set("points", updatedPoints.toString(), {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 semaine
    });

    return updatedPoints;
}

/**
 * Réinitialise les points à 100 dans les cookies
 */
export async function resetSessionPoints() {
    const store = await cookies(); // ✅ await ici

    store.set("points", "100", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    return 100;
}

/**
 * Met à jour le pseudo stocké dans les cookies
 */
export async function updateSessionPseudo(newPseudo: string) {
    const store = await cookies(); // ✅ await ici

    store.set("pseudo", newPseudo, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    return newPseudo;
}
