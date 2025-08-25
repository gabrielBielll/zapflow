import { ChatSimulation } from '@/components/chat-simulation';
import { DashboardNav } from '@/components/dashboard-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      <DashboardNav />
      <main className="flex-grow overflow-y-auto">
        {children}
      </main>
      <ChatSimulation />
    </div>
  );
}
