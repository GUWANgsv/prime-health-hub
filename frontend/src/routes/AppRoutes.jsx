import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import GuestHomePage from "../pages/GuestHomePage";
import RegisterPatientPage from "../pages/RegisterPatientPage";
import RegisterDoctorPage from "../pages/RegisterDoctorPage";
import LoginPage from "../pages/LoginPage";
import PatientDashboardPage from "../pages/PatientDashboardPage";
import DoctorDashboardPage from "../pages/DoctorDashboardPage";
import AdminDashboardPage from "../pages/AdminDashboardPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<GuestHomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/patient" element={<RegisterPatientPage />} />
      <Route path="/register/doctor" element={<RegisterDoctorPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={["PATIENT"]} />}>
          <Route path="/dashboard/patient" element={<PatientDashboardPage />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={["DOCTOR"]} />}>
          <Route path="/dashboard/doctor" element={<DoctorDashboardPage />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/dashboard/admin" element={<AdminDashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
