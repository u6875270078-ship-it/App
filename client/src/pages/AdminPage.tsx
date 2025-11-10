import { useState } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AdminPanel from "@/components/AdminPanel";
import { Settings, LayoutDashboard, Bell, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/admin" },
  { title: "Paramètres", icon: Settings, url: "/admin/settings" },
  { title: "Notifications", icon: Bell, url: "/admin/notifications" },
];

export default function AdminPage() {
  const [location] = useLocation();
  const [config, setConfig] = useState<TelegramConfig | null>(null);

  const handleSaveConfig = (newConfig: TelegramConfig) => {
    console.log("Saving Telegram config:", newConfig);
    setConfig(newConfig);
  };

  const handleTestConnection = (testConfig: TelegramConfig) => {
    console.log("Testing Telegram connection:", testConfig);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <div className="px-4 py-4">
                <h2 className="text-lg font-bold" data-testid="text-sidebar-title">
                  Admin Panel
                </h2>
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location === item.url}>
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto p-4 border-t">
              <SidebarMenuButton asChild>
                <button
                  onClick={() => console.log("Logout clicked")}
                  className="w-full"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </button>
              </SidebarMenuButton>
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1">
          <header className="flex items-center gap-4 p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-xl font-semibold">Configuration Telegram</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <AdminPanel onSave={handleSaveConfig} onTest={handleTestConnection} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
