import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { Login } from "../pages/Login"; 
import { Home } from "../pages/Home";
import { NotFound } from "../pages/NotFound";
import { Register } from "../pages/Register";
import { Appointments } from "../pages/Appointment";
import { AdminPanel } from "../pages/AdminPanel";
import { ProtectedRoute } from "../components/ProtectedRoute"
import { AdminPatient } from "../pages/AdminPatient";
const AppRouter = () => {
    return (
       <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/Login" element={<Login />} />
                    <Route path="/Register" element={<Register />} />

                    {/* 🔒 Protegemos rutas */}
                    {/*Rutas de pacientes*/}
                    <Route path="/appointments" element={<ProtectedRoute role="patient"><Appointments /></ProtectedRoute>} />
                    
                    {/*Rutas del profesional*/}
                    <Route path="/admin/turnos" element={<ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>} />
                    <Route path="/admin/patients" element={<ProtectedRoute role="admin"><AdminPatient /></ProtectedRoute>} />
                          
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export { AppRouter };
