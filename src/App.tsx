import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import LoginSelector from "./pages/LoginSelector";
import PatientAuth from "./pages/auth/PatientAuth";
import DoctorLogin from "./pages/auth/DoctorLogin";
import AdminLogin from "./pages/auth/AdminLogin";
import ResetPassword from "./pages/ResetPassword";
import Doctors from "./pages/Doctors";
import DoctorProfile from "./pages/DoctorProfile";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import Locations from "./pages/Locations";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<LoginSelector />} />
            <Route path="/login/paciente" element={<PatientAuth />} />
            <Route path="/login/medico" element={<DoctorLogin />} />
            <Route path="/login/admin" element={<AdminLogin />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/medicos" element={<Doctors />} />
            <Route path="/medicos/:id" element={<DoctorProfile />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/contactos" element={<Contact />} />
            <Route path="/localizacoes" element={<Locations />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
