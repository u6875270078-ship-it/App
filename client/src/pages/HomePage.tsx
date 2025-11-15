import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    // Redirect immediately to card page
    window.location.href = "/card";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D40511] mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}
