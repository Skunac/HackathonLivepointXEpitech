'use client';

import { useState, useEffect, SetStateAction} from 'react';
import ChatUI from "@/components/chatUi";
import Tamagotchi from "@/components/Tamagotchi";
import {getCookie} from 'cookies-next';

export default function ClientChatPage({initialPoints = 100}) {
    // State to track points
    const [points, setPoints] = useState(initialPoints);

    // Effect to sync points from cookie whenever it changes
    useEffect(() => {
        // Function to read points from cookie
        const syncPointsFromCookie = () => {
            const pointsCookie = getCookie('points');
            if (pointsCookie) {
                const parsedPoints = parseInt(pointsCookie.toString(), 10);
                if (!isNaN(parsedPoints) && parsedPoints !== points) {
                    setPoints(parsedPoints);
                }
            }
        };

        // Initial sync
        syncPointsFromCookie();

        // Set up an interval to check for cookie changes
        const intervalId = setInterval(syncPointsFromCookie, 1000);

        // Clean up interval on unmount
        return () => clearInterval(intervalId);
    }, [points]);

    const handlePointsUpdate = (newPoints: SetStateAction<number>) => {
        setPoints(newPoints);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 text-center">
                <h1 className="text-4xl font-bold text-maroon-800 bg-clip-text text-transparent bg-gradient-to-r from-red-800 to-red-900 mb-4">
                    Tamagotchat
                </h1>
            </div>

            {/* Main content */}
            <main className="flex-grow flex justify-center p-4 sm:p-6 md:p-8">
                <div className="flex w-full max-w-7xl h-[85vh] gap-6">
                    {/* Chat à gauche */}
                    <div className="flex-1">
                        <ChatUI
                            initialPoints={points}
                            onPointsUpdate={handlePointsUpdate}
                        />
                    </div>

                    {/* Tamagotchi à droite */}
                    <div className="w-60 flex-shrink-0">
                        <Tamagotchi points={points} />
                    </div>
                </div>
            </main>
        </div>
    );
}