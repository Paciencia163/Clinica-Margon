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

const Contact = () => {
  const [main, setMain] = useState<Location | null>(null);

  useEffect(() => {
    supabase
      .from("clinic_locations")
      .select("*")
      .eq("active", true)
      .eq("is_main", true)
      .maybeSingle()
      .then(({ data }) => setMain((data as any) ?? null));
  }, []);

  const locations = main ? [main] : [];
  const mapSrc = main
    ? main.maps_url && main.maps_url.includes("output=embed")
      ? main.maps_url
      : `https://www.google.com/maps?q=${
          main.latitude && main.longitude
            ? `${main.latitude},${main.longitude}`
            : encodeURIComponent(`${main.name} ${main.endereco} ${main.municipio}`)
        }&hl=pt&z=15&output=embed`
    : "";

  const cleanTel = (s: string | null) => (s ?? "").replace(/[^+\d]/g, "");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="gradient-hero text-primary-foreground py-16">
        <div className="container">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">Contactos</h1>
          <p className="text-primary-foreground/80 max-w-2xl text-lg">
            Visite-nos no Lubango, Huíla. Estamos prontos para o atender.
          </p>
        </div>
      </section>

      <section className="container py-12 flex-1 grid lg:grid-cols-2 gap-8">
        <Card className="overflow-hidden shadow-card">
          {mapSrc ? (
            <iframe
              title="Mapa Clínica Margon"
              src={mapSrc}
              className="w-full h-[400px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="h-[400px] bg-muted flex items-center justify-center text-muted-foreground">Mapa indisponível</div>
          )}
        </Card>

        <div className="space-y-4">
          {locations.map((loc) => (
            <Card key={loc.id} className="p-6 shadow-card">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <h2 className="font-display text-xl font-bold">{loc.name}</h2>
                  <Badge variant="secondary" className="mt-1">{loc.municipio}, {loc.provincia}</Badge>
                </div>
                {loc.is_main && <Badge>Sede</Badge>}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                  <span>{loc.endereco}{loc.bairro ? ` — ${loc.bairro}` : ""}</span>
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
                    <a href={`tel:${cleanTel(loc.phone)}`} className="hover:text-primary transition-smooth">{loc.phone}</a>
                  </div>
                )}
                {loc.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                    <a href={`mailto:${loc.email}`} className="hover:text-primary transition-smooth">{loc.email}</a>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-border/40">
                {loc.phone && (
                  <Button asChild variant="hero" size="sm">
                    <a href={`tel:${cleanTel(loc.phone)}`}><Phone className="h-4 w-4" /> Ligar</a>
                  </Button>
                )}
                {loc.whatsapp && (
                  <Button asChild variant="soft" size="sm">
                    <a href={`https://wa.me/${cleanTel(loc.whatsapp).replace(/^\+/, "")}`} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                )}
                {loc.maps_url && (
                  <Button asChild variant="outline" size="sm">
                    <a href={loc.maps_url} target="_blank" rel="noreferrer">
                      <Navigation className="h-4 w-4" /> Como chegar
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {locations.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">Nenhum local cadastrado.</Card>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
