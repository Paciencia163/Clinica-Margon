import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const DashboardLayout = ({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <div className="gradient-soft border-b border-border/40">
      <div className="container py-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
      </div>
    </div>
    <main className="container py-10 flex-1">{children}</main>
    <Footer />
  </div>
);
