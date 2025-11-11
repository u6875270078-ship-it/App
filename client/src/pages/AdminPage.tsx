import { useState, useEffect } from "react";
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
import { Settings, LayoutDashboard, Bell, LogOut, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TelegramConfig {
  telegramBotToken: string;
  telegramChatId: string;
}

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, url: "/admin" },
  { title: "Paramètres", icon: Settings, url: "/admin/settings" },
  { title: "Notifications", icon: Bell, url: "/admin/notifications" },
];

export default function AdminPage() {
  const [location, setLocation] = useLocation();
  const [config, setConfig] = useState<TelegramConfig | null>(null);
  const { toast } = useToast();

  // Check if admin setup is complete
  const { data: setupStatus, isLoading: checkingSetup } = useQuery<{ isSetup: boolean }>({
    queryKey: ["/api/admin/check-setup"],
  });

  // Check if user is authenticated
  const { data: authStatus, isLoading: checkingAuth } = useQuery<{ isAuthenticated: boolean }>({
    queryKey: ["/api/admin/check-auth"],
    enabled: setupStatus?.isSetup === true,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/logout");
    },
    onSuccess: () => {
      toast({
        title: "Déconnecté",
        description: "Vous avez été déconnecté avec succès",
      });
      setLocation("/admin/login");
    },
  });

  // Redirect logic
  useEffect(() => {
    if (checkingSetup || checkingAuth) return;

    if (setupStatus?.isSetup === false) {
      setLocation("/admin/setup");
    } else if (authStatus?.isAuthenticated === false) {
      setLocation("/admin/login");
    }
  }, [setupStatus, authStatus, checkingSetup, checkingAuth, setLocation]);

  const handleSaveConfig = (newConfig: TelegramConfig) => {
    console.log("Saving Telegram config:", newConfig);
    setConfig(newConfig);
  };

  const handleTestConnection = (testConfig: TelegramConfig) => {
    console.log("Testing Telegram connection:", testConfig);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Show loading while checking authentication
  if (checkingSetup || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Vérification...</p>
        </div>
      </div>
    );
  }

  // Don't render admin panel if not authenticated
  if (setupStatus?.isSetup === false || authStatus?.isAuthenticated === false) {
    return null;
  }

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
                  onClick={handleLogout}
                  className="w-full"
                  data-testid="button-logout"
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{logoutMutation.isPending ? "Déconnexion..." : "Déconnexion"}</span>
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
