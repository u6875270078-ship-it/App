import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, Save, CheckCircle2 } from "lucide-react";

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

interface AdminPanelProps {
  onSave?: (config: TelegramConfig) => void;
  onTest?: (config: TelegramConfig) => void;
}

export default function AdminPanel({ onSave, onTest }: AdminPanelProps) {
  const [config, setConfig] = useState<TelegramConfig>({
    botToken: "",
    chatId: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onSave?.(config);
    toast({
      title: "Configuration sauvegardée",
      description: "Les paramètres Telegram ont été enregistrés avec succès.",
    });
    setIsSaving(false);
  };

  const handleTest = async () => {
    setIsTesting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onTest?.(config);
    toast({
      title: "Test de connexion",
      description: "Message de test envoyé sur Telegram.",
    });
    setIsTesting(false);
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
                value={config.botToken}
                onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
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
                value={config.chatId}
                onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
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
              disabled={!config.botToken || !config.chatId || isTesting}
              data-testid="button-test-connection"
              className="flex-1"
            >
              <Send className="mr-2 h-4 w-4" />
              {isTesting ? "Test en cours..." : "Tester la connexion"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!config.botToken || !config.chatId || isSaving}
              data-testid="button-save-config"
              className="flex-1"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Enregistrement..." : "Sauvegarder"}
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
                <CheckCircle2 className="h-4 w-4 text-green-500" data-testid="icon-status" />
                <span className="font-medium" data-testid="text-status">Connecté</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Dernière synchronisation</p>
              <p className="font-medium" data-testid="text-last-sync">
                {new Date().toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>Dernières notifications envoyées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium" data-testid={`text-activity-${i}`}>
                    Paiement reçu - €{(Math.random() * 200 + 50).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(Date.now() - i * 3600000).toLocaleString('fr-FR')}
                  </p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
                  Envoyé
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
