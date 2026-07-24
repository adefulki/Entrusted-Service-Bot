"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold tracking-tight">
          Entrusted Service
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/marketplace"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Marketplace
          </Link>
          {session && (
            <>
              <Link
                href="/marketplace/my-listings"
                className="text-sm text-muted-foreground hover:text-foreground transition"
              >
                My Listings
              </Link>
              <Link
                href="/marketplace/my-offers"
                className="text-sm text-muted-foreground hover:text-foreground transition"
              >
                My Offers
              </Link>
              {(session.user as any)?.role === "ADMIN" && (
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Dashboard
                </Link>
              )}
            </>
          )}
        </div>

        {/* Auth Section */}
        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {session.user?.name || (session.user as any)?.username}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:opacity-80 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("discord")}
              className="text-sm px-4 py-2 bg-[#5865F2] text-white rounded-lg font-medium hover:opacity-90 transition"
            >
              Sign in with Discord
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t px-4 py-4 space-y-3 bg-background">
          <Link
            href="/marketplace"
            onClick={() => setMenuOpen(false)}
            className="block text-sm text-muted-foreground hover:text-foreground"
          >
            Marketplace
          </Link>
          {session && (
            <>
              <Link
                href="/marketplace/my-listings"
                onClick={() => setMenuOpen(false)}
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                My Listings
              </Link>
              <Link
                href="/marketplace/my-offers"
                onClick={() => setMenuOpen(false)}
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                My Offers
              </Link>
              {(session.user as any)?.role === "ADMIN" && (
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm text-muted-foreground hover:text-foreground"
                >
                  Dashboard
                </Link>
              )}
            </>
          )}
          <div className="pt-3 border-t">
            {session ? (
              <button
                onClick={() => signOut()}
                className="text-sm px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:opacity-80 transition"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => signIn("discord")}
                className="text-sm px-4 py-2 bg-[#5865F2] text-white rounded-lg font-medium hover:opacity-90 transition"
              >
                Sign in with Discord
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
