'use client';

import { useEffect, useState } from "react";

export default function Tamagotchi() {
    const [points, setPoints] = useState<number>(100);

    useEffect(() => {
        fetch("/api/session/score")
            .then((res) => res.json())
            .then((data) => {
                setPoints(data.points);
            })
            .catch((err) => console.error("Erreur récupération points:", err));
    }, []);

    const getTamagotchiImage = () => {
        if (points >= 80) {
            return "tamagotchi/gold-svgrepo-com.svg";
        } else if (points >= 50) {
            return "/tamagotchi/insurance-svgrepo-com.svg";
        } else if (points >= 20) {
            return "/tamagotchi/loss-svgrepo-com.svg";
        } else {
            return "/tamagotchi/stock-svgrepo-com.svg";
        }
    };

    return (
        <div className="flex flex-col items-center p-4">
            <img
                src={getTamagotchiImage()}
                alt="Tamagotchi"
                className="w-40 h-40"
            />
            <p className="mt-2 text-center font-semibold">
                Ton score Green IT : {points}
            </p>
        </div>
    );
}
