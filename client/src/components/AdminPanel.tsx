import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, Save, CheckCircle2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface TelegramConfig {
  telegramBotToken: string;
  telegramChatId: string;
}

interface AdminPanelProps {
  onSave?: (config: TelegramConfig) => void;
  onTest?: (config: TelegramConfig) => void;
}

export default function AdminPanel({ onSave, onTest }: AdminPanelProps) {
  const [config, setConfig] = useState<TelegramConfig>({
    telegramBotToken: "",
    telegramChatId: "",
  });
  const { toast } = useToast();

  const { data: settings } = useQuery<TelegramConfig & { updatedAt?: Date }>({
    queryKey: ["/api/admin/settings"],
  });

  useEffect(() => {
    if (settings) {
      setConfig({
        telegramBotToken: settings.telegramBotToken || "",
        telegramChatId: settings.telegramChatId || "",
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: TelegramConfig) => {
      await apiRequest("POST", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      onSave?.(config);
      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres Telegram ont été enregistrés avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (data: TelegramConfig) => {
      await apiRequest("POST", "/api/admin/test-telegram", {
        botToken: data.telegramBotToken,
        chatId: data.telegramChatId,
      });
    },
    onSuccess: () => {
      onTest?.(config);
      toast({
        title: "Test de connexion",
        description: "Message de test envoyé sur Telegram avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur de test",
        description: "Impossible d'envoyer le message de test. Vérifiez vos paramètres.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(config);
  };

  const handleTest = () => {
    testMutation.mutate(config);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-admin-title">Configuration Admin</h1>
        <p className="text-muted-foreground mt-1">
          Gérez les paramètres de notification Telegram
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intégration Telegram</CardTitle>
          <CardDescription>
            Configurez votre bot Telegram pour recevoir les notifications de paiement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botToken">Bot Token</Label>
              <Input
                id="botToken"
                data-testid="input-bot-token"
                type="text"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={config.telegramBotToken}
                onChange={(e) => setConfig({ ...config, telegramBotToken: e.target.value })}
                className="font-mono text-sm h-12"
              />
              <p className="text-xs text-muted-foreground">
                Obtenez votre token auprès de @BotFather sur Telegram
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chatId">Chat ID</Label>
              <Input
                id="chatId"
                data-testid="input-chat-id"
                type="text"
                placeholder="-1001234567890"
                value={config.telegramChatId}
                onChange={(e) => setConfig({ ...config, telegramChatId: e.target.value })}
                className="font-mono text-sm h-12"
              />
              <p className="text-xs text-muted-foreground">
                ID du chat ou canal où recevoir les notifications
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleTest}
              variant="secondary"
              disabled={!config.telegramBotToken || !config.telegramChatId || testMutation.isPending}
              data-testid="button-test-connection"
              className="flex-1"
            >
              <Send className="mr-2 h-4 w-4" />
              {testMutation.isPending ? "Test en cours..." : "Tester la connexion"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!config.telegramBotToken || !config.telegramChatId || saveMutation.isPending}
              data-testid="button-save-config"
              className="flex-1"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Enregistrement..." : "Sauvegarder"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>État de la connexion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Statut</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 
                  className={`h-4 w-4 ${config.telegramBotToken && config.telegramChatId ? 'text-green-500' : 'text-muted-foreground'}`} 
                  data-testid="icon-status" 
                />
                <span className="font-medium" data-testid="text-status">
                  {config.telegramBotToken && config.telegramChatId ? 'Configuré' : 'Non configuré'}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
              <p className="font-medium" data-testid="text-last-sync">
                {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString('fr-FR') : 'Jamais'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
