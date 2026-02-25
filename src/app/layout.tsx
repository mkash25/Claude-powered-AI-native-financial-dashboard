import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Financial Dashboard",
  description: "Personal portfolio intelligence powered by Claude",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isAuth = !!user;

  return (
    <html lang="en" className="dark">
      <body className="bg-[#1a1a2e] text-gray-200 antialiased">
        {isAuth ? (
          <div className="flex min-h-screen">
            <Sidebar />
            {/* Desktop: push content right of sidebar. Mobile: full width + bottom nav padding */}
            <main className="flex-1 md:ml-56 min-h-screen pb-20 md:pb-0">
              {children}
            </main>
          </div>
        ) : (
          // Auth pages: no sidebar
          <>{children}</>
        )}
      </body>
    </html>
  );
}
