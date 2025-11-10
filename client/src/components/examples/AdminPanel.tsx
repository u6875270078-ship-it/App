import AdminPanel from '../AdminPanel';
import { Toaster } from "@/components/ui/toaster";

export default function AdminPanelExample() {
  return (
    <>
      <AdminPanel 
        onSave={(config) => console.log('Save config:', config)}
        onTest={(config) => console.log('Test connection:', config)}
      />
      <Toaster />
    </>
  );
}
