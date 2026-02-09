'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { AgentChat } from '@/components/chat/agent-chat';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ms-[260px] transition-all duration-300">
        <Header />
        <main className="flex-1 p-6 gradient-mesh min-h-0">
          {children}
        </main>
      </div>
      <AgentChat />
    </div>
  );
}
