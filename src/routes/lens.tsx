import { createFileRoute } from "@tanstack/react-router";
import { GoogleLensVisualSearch } from "@/components/marketplace/GoogleLensVisualSearch";

export const Route = createFileRoute("/lens")({
  component: LensPage,
});

function LensPage() {
  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <GoogleLensVisualSearch />
      </div>
    </main>
  );
}
