import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Home, RefreshCw } from "lucide-react";

export default function DHLErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-2 border-red-500">
        <CardHeader className="space-y-3 text-center bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="flex justify-center">
            <div className="bg-white rounded-full p-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Paiement échoué
          </CardTitle>
          <CardDescription className="text-white/90">
            Une erreur s'est produite lors du traitement de votre paiement
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium mb-2">
              Raisons possibles :
            </p>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>Informations de carte incorrectes</li>
              <li>Fonds insuffisants</li>
              <li>Carte expirée ou bloquée</li>
              <li>Problème de connexion</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-12 bg-gradient-to-r from-[#FFCC00] to-[#D40511] hover:opacity-90 text-white font-semibold"
              onClick={() => window.location.href = "/"}
              data-testid="button-retry"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Réessayer le paiement
            </Button>

            <Button
              variant="outline"
              className="w-full h-12"
              onClick={() => window.location.href = "/"}
              data-testid="button-home"
            >
              <Home className="mr-2 h-5 w-5" />
              Retour à l'accueil
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600 border-t pt-4">
            <p className="mb-2">Besoin d'aide ?</p>
            <p className="text-xs text-gray-500">
              Contactez notre service client : <br />
              <span className="font-semibold">support@dhl.com</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
