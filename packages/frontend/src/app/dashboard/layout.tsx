import { ChatSimulation } from '@/components/chat-simulation';
import { ChatbotList } from '@/components/chatbot-list';
import { DashboardNav } from '@/components/dashboard-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      <aside className="w-1/4 border-r overflow-y-auto">
        <ChatbotList />
      </aside>
      <div className="flex flex-col flex-grow">
        <DashboardNav />
        <main className="flex-grow overflow-y-auto">
          {children}
        </main>
      </div>
      <ChatSimulation />
    </div>
  );
}
