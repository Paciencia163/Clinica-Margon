import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Clock, Mail, MessageCircle, Navigation } from "lucide-react";

interface Location {
  id: string;
  name: string;
  provincia: string;
  municipio: string;
  bairro: string | null;
  endereco: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: string | null;
  is_main: boolean;
}

const cleanTel = (s: string | null) => (s ?? "").replace(/[^+\d]/g, "");

const Locations = () => {
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    supabase
      .from("clinic_locations")
      .select("*")
      .eq("active", true)
      .order("is_main", { ascending: false })
      .then(({ data }) => setLocations((data as any) ?? []));
  }, []);

  const directions = (l: Location) =>
    l.maps_url ||
    (l.latitude && l.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${l.latitude},${l.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.name} ${l.endereco} ${l.municipio}`)}`);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="gradient-hero text-primary-foreground py-16">
        <div className="container">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">As nossas localizações</h1>
          <p className="text-primary-foreground/80 max-w-2xl text-lg">
            Encontre a Clínica Margon mais próxima de si.
          </p>
        </div>
      </section>

      <section className="container py-12 flex-1">
        {locations.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">Nenhum local disponível.</Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {locations.map((loc) => (
              <Card key={loc.id} className="p-6 shadow-card hover:shadow-elegant transition-smooth">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <h2 className="font-display text-xl font-bold">{loc.name}</h2>
                    <Badge variant="secondary" className="mt-1">
                      {loc.municipio}, {loc.provincia}
                    </Badge>
                  </div>
                  {loc.is_main && <Badge>Sede</Badge>}
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                    <span>
                      {loc.endereco}
                      {loc.bairro ? ` — ${loc.bairro}` : ""}
                    </span>
                  </div>
                  {loc.opening_hours && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                      <span>{loc.opening_hours}</span>
                    </div>
                  )}
                  {loc.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                      <a href={`tel:${cleanTel(loc.phone)}`} className="hover:text-primary transition-smooth">
                        {loc.phone}
                      </a>
                    </div>
                  )}
                  {loc.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                      <a href={`mailto:${loc.email}`} className="hover:text-primary transition-smooth">
                        {loc.email}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-border/40">
                  {loc.phone && (
                    <Button asChild variant="hero" size="sm">
                      <a href={`tel:${cleanTel(loc.phone)}`}>
                        <Phone className="h-4 w-4" /> Ligar
                      </a>
                    </Button>
                  )}
                  {loc.whatsapp && (
                    <Button asChild variant="soft" size="sm">
                      <a
                        href={`https://wa.me/${cleanTel(loc.whatsapp).replace(/^\+/, "")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button asChild variant="outline" size="sm">
                    <a href={directions(loc)} target="_blank" rel="noreferrer">
                      <Navigation className="h-4 w-4" /> Como chegar
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Locations;
