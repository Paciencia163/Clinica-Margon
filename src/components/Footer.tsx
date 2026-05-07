import { Stethoscope, MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => (
  <footer id="contacto" className="border-t border-border/40 bg-primary text-primary-foreground mt-24">
    <div className="container py-16 grid gap-10 md:grid-cols-4">
      <div className="md:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-secondary-foreground" />
          </div>
          <span className="font-display font-bold text-xl">Clínica Margon</span>
        </div>
        <p className="text-primary-foreground/70 max-w-md leading-relaxed">
          Cuidados de saúde modernos, humanos e acessíveis no Lubango. Marque a sua consulta online em poucos cliques.
        </p>
      </div>
      <div>
        <h4 className="font-display font-semibold mb-3">Plataforma</h4>
        <ul className="space-y-2 text-sm text-primary-foreground/70">
          <li><Link to="/medicos" className="hover:text-secondary transition-smooth">Médicos</Link></li>
          <li><Link to="/contactos" className="hover:text-secondary transition-smooth">Contactos</Link></li>
          <li><Link to="/auth?mode=signup" className="hover:text-secondary transition-smooth">Registar</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-display font-semibold mb-3">Contacto</h4>
        <ul className="space-y-2 text-sm text-primary-foreground/70">
          <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> Rua da Sé Catedral 45, Lubango — Huíla, Angola</li>
          <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5 shrink-0" /> <a href="tel:+244923000000" className="hover:text-secondary">+244 923 000 000</a></li>
          <li className="flex items-start gap-2"><MessageCircle className="h-4 w-4 mt-0.5 shrink-0" /> <a href="https://wa.me/244923000000" target="_blank" rel="noreferrer" className="hover:text-secondary">WhatsApp</a></li>
          <li className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5 shrink-0" /> <a href="mailto:geral@margon.ao" className="hover:text-secondary">geral@margon.ao</a></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-primary-foreground/10">
      <div className="container py-6 text-xs text-primary-foreground/50 text-center">
        © {new Date().getFullYear()} Clínica Margon · Lubango, Huíla — Angola. Todos os direitos reservados.
      </div>
    </div>
  </footer>
);
