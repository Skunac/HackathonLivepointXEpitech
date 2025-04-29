import ChatUI from "@/components/chatUi";
import Tamagotchi from "@/components/Tamagotchi";
import { getSessionData } from "@/lib/utils/session";

export default async function ChatPage() {
    const { pseudo, points } = await getSessionData();

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 text-center">
                <h1 className="text-4xl font-bold text-maroon-800 bg-clip-text text-transparent bg-gradient-to-r from-red-800 to-red-900 mb-4">
                    Bienvenue {pseudo} 🌿
                </h1>
            </div>

            {/* Main content */}
            <main className="flex-grow flex justify-center p-4 sm:p-6 md:p-8">
                <div className="flex w-full max-w-7xl h-[85vh] gap-6">
                    {/* Chat à gauche */}
                    <div className="flex-1">
                        <ChatUI />
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
