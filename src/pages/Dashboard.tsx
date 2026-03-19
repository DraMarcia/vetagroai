import { useState } from "react";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardChat } from "@/components/DashboardChat";
import { DashboardInsights } from "@/components/DashboardInsights";
import { ChatbotAssistant } from "@/components/ChatbotAssistant";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(true);

  return (
    <ProfileProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-12 flex items-center justify-between border-b border-border px-4 bg-background flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setInsightsOpen(!insightsOpen)}
            >
              {insightsOpen ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </Button>
          </header>

          {/* Content */}
          <div className="flex-1 flex min-h-0">
            <DashboardChat />
            {insightsOpen && <DashboardInsights />}
          </div>
        </div>

        <ChatbotAssistant />
      </div>
    </ProfileProvider>
  );
}
