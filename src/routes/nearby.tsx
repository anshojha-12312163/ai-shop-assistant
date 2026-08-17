import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/marketplace/Nav";
import { Footer } from "@/components/marketplace/Footer";
import { NearbyShopsWidget } from "@/components/marketplace/NearbyShopsWidget";

export const Route = createFileRoute("/nearby")({
  head: () => ({
    meta: [
      { title: "Find Shops Near Me — Synthetix AI Shop Assistant" },
      {
        name: "description",
        content:
          "Find nearby stores and local shops with Google Maps search, distance calculation in km, field masking cost optimization, and interactive map pins.",
      },
    ],
  }),
  component: NearbyPage,
});

function NearbyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Nav />

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-8 pb-16 w-full">
        <NearbyShopsWidget initialKeyword="all categories" />
      </main>

      <Footer />
    </div>
  );
}
