interface TamagotchiProps {
    points: number;
}

export default function Tamagotchi({ points }: TamagotchiProps) {
    const getTamagotchiImage = () => {
        if (points >= 80) return "/tamagotchi/100-67.png";
        if (points < 80 && points >= 37) return "/tamagotchi/66-34.png";
        if (points < 37 && points > 10) return "/tamagotchi/33-10.png";
        if (points <= 10) return "/tamagotchi/10-0.png";
    };

    return (
        <div className="flex flex-col items-center p-4">
            <img
                src={getTamagotchiImage()}
                alt="Tamagotchi"
                className="w-40 h-40"
            />
            <p className="mt-2 text-center font-semibold text-black">
                🌿 Ton score Green IT : {points}
            </p>
        </div>
    );
}
