import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import VisitorTracking from "@/components/VisitorTracking";

export default function VisitorDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Link href="/panel-x7k9m2n5">
            <Button variant="outline" size="icon" data-testid="button-back-to-admin">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-visitor-dashboard-title">
              Suivi des Visiteurs
            </h1>
            <p className="text-muted-foreground mt-1">
              Tableau de bord de tracking en temps réel
            </p>
          </div>
        </div>

        <VisitorTracking />
      </div>
    </div>
  );
}
