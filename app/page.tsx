import { getSessionData } from "@/lib/utils/session";
import ClientChatPage from "@/components/clientChatPage";

export default async function ChatPage() {
    // Get initial points from server cookies
    const { points = 100 } = await getSessionData();

    return <ClientChatPage initialPoints={points} />;
}