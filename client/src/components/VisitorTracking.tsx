import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Trash2, RefreshCw, MapPin, Smartphone, Monitor, Globe } from "lucide-react";

interface VisitorLog {
  id: string;
  sessionId: string | null;
  flowType: string;
  ipAddress: string;
  country: string | null;
  city: string | null;
  region: string | null;
  isp: string | null;
  userAgent: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  language: string | null;
  referrer: string | null;
  currentPage: string | null;
  isBot: string;
  isMobile: string;
  isProxy: string;
  connectionType: string | null;
  createdAt: Date;
}

export default function VisitorTracking() {
  const { toast } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data: visitors = [], refetch } = useQuery<VisitorLog[]>({
    queryKey: ["/api/admin/visitors"],
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/visitors/clear");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/visitors"] });
      toast({
        title: "Logs supprimés",
        description: "Tous les logs de visiteurs ont été supprimés.",
      });
    },
  });

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  const stats = {
    total: visitors.length,
    dhl: visitors.filter(v => v.flowType === 'dhl').length,
    paypal: visitors.filter(v => v.flowType === 'paypal').length,
    bots: visitors.filter(v => v.isBot === 'true').length,
    mobile: visitors.filter(v => v.isMobile === 'true').length,
    proxy: visitors.filter(v => v.isProxy === 'true').length,
  };

  const getOsIcon = (os: string | null) => {
    if (!os) return '💻';
    const osLower = os.toLowerCase();
    if (osLower.includes('windows')) return '🪟';
    if (osLower.includes('mac') || osLower.includes('ios')) return '🍎';
    if (osLower.includes('android')) return '🤖';
    if (osLower.includes('linux')) return '🐧';
    return '💻';
  };

  const getCountryFlag = (country: string | null) => {
    if (!country) return '🌍';
    const countryCode = country.toUpperCase();
    // Convert country code to flag emoji
    return countryCode
      .split('')
      .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
      .join('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Tracking des Visiteurs
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Surveillez en temps réel tous les visiteurs de vos pages DHL et PayPal
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            data-testid="button-toggle-auto-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            data-testid="button-manual-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending || visitors.length === 0}
            data-testid="button-clear-logs"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Effacer tout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Visiteurs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.dhl}</div>
            <div className="text-xs text-muted-foreground">DHL</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.paypal}</div>
            <div className="text-xs text-muted-foreground">PayPal</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.bots}</div>
            <div className="text-xs text-muted-foreground">Bots</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.mobile}</div>
            <div className="text-xs text-muted-foreground">Mobile</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.proxy}</div>
            <div className="text-xs text-muted-foreground">Proxy/VPN</div>
          </CardContent>
        </Card>
      </div>

      {/* Visitor Cards */}
      {visitors.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun visiteur enregistré pour le moment</p>
            <p className="text-sm mt-2">Les visiteurs apparaîtront automatiquement ici</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visitors.map((visitor) => (
            <Card
              key={visitor.id}
              className={`${
                visitor.isBot === 'true' ? 'border-l-4 border-l-red-500' :
                visitor.isProxy === 'true' ? 'border-l-4 border-l-orange-500' :
                'border-l-4 border-l-green-500'
              }`}
              data-testid={`visitor-card-${visitor.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base font-mono">{visitor.ipAddress}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {new Date(visitor.createdAt).toLocaleString('fr-FR')}
                    </CardDescription>
                  </div>
                  <Badge variant={visitor.flowType === 'dhl' ? 'default' : 'secondary'}>
                    {visitor.flowType.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Location */}
                {(visitor.city || visitor.country) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {getCountryFlag(visitor.country)} {visitor.city || visitor.country}
                      {visitor.region && `, ${visitor.region}`}
                    </span>
                  </div>
                )}

                {/* Device Info */}
                <div className="flex items-center gap-2 text-sm">
                  {visitor.isMobile === 'true' ? (
                    <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate">
                    {getOsIcon(visitor.os)} {visitor.browser || 'Inconnu'} • {visitor.device || 'Inconnu'}
                  </span>
                </div>

                {/* ISP */}
                {visitor.isp && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate text-muted-foreground">{visitor.isp}</span>
                  </div>
                )}

                {/* Current Page */}
                {visitor.currentPage && (
                  <div className="text-xs text-muted-foreground truncate">
                    📄 {visitor.currentPage}
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-1 pt-2">
                  {visitor.isBot === 'true' && (
                    <Badge variant="destructive" className="text-xs">
                      🤖 Bot
                    </Badge>
                  )}
                  {visitor.isProxy === 'true' && (
                    <Badge className="text-xs bg-orange-500">
                      🔒 Proxy/VPN
                    </Badge>
                  )}
                  {visitor.isMobile === 'true' && (
                    <Badge variant="outline" className="text-xs">
                      📱 Mobile
                    </Badge>
                  )}
                  {visitor.connectionType && (
                    <Badge variant="outline" className="text-xs">
                      📶 {visitor.connectionType.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
