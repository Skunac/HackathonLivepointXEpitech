import ChatUI from "@/components/chatUi";

export default function ChatPage() {
    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center pt-6">
                <h1 className="text-4xl font-bold text-maroon-800 bg-clip-text text-transparent bg-gradient-to-r from-red-800 to-red-900">
                    Tamagotchat
                </h1>
            </div>

            {/* Main content */}
            <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-5xl h-[85vh]">
                    <ChatUI />
                </div>
            </main>
        </div>
    );
}