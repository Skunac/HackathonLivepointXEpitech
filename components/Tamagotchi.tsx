interface TamagotchiProps {
    points: number;
}

export default function Tamagotchi({ points }: TamagotchiProps) {
    const getTamagotchiImage = () => {
        if (points >= 80) return "/tamagotchi/gold-svgrepo-com.svg";
        if (points >= 50) return "/tamagotchi/insurance-svgrepo-com.svg";
        if (points >= 20) return "/tamagotchi/loss-svgrepo-com.svg";
        return "/tamagotchi/stock-svgrepo-com.svg";
    };

    return (
        <div className="flex flex-col items-center p-4">
            <img
                src={getTamagotchiImage()}
                alt="Tamagotchi"
                className="w-40 h-40"
            />
            <p className="mt-2 text-center font-semibold">
                🌿 Ton score Green IT : {points}
            </p>
        </div>
    );
}
