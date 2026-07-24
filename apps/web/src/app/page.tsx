import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Entrusted Service
        </h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Secure Escrow & Middleman Marketplace with Discord Integration
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/marketplace"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition"
          >
            Marketplace
          </Link>
        </div>
      </div>
    </main>
  );
}
