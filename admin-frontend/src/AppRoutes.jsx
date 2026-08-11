import {
    BrowserRouter as Router,
    Route,
    Routes,
} from "react-router-dom";



import SignUp from "./admin/pages/SignUp";
import Login from "./admin/pages/Login";
import AdminRoutes from "./admin/AdminRoutes";
import ReceptionRoutes from "./receptionist/ReceptionRoutes";
import DiagnosticTechnicianRoutes from "./diagnostic-technician/DiagnosticTechnicianRoutes";
import TechnicianRoutes from "./technician/TechnicianRoutes";
import ManagerRoutes from "./manager/ManagerRoutes";
import CustomerRoutes from "./customer/CustomerRoutes";
import InventoryManagerRoutes from "./inventoryManager/InventoryManagerRoutes";
import SalesManagerRoutes from "./salesManager/SalesManagerRoutes";
import NewCustomer from "./customer/NewCustomer";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./context/ThemeContext";

const AppRoutes = () => {
    return (
        <Router>
            <ThemeProvider>
            <Routes>
                <Route exact path="/add-new-customer" element={<NewCustomer />} />
                <Route exact path="/" element={<Login />} />
                <Route exact path="/login" element={<Login />} />
                {/* <Route exact path="/signup" element={<SignUp />} /> */}
                
                <Route path="/admin/*" element={<AdminRoutes />} />
                <Route path="/manager/*" element={<ManagerRoutes />} />
                <Route path="/receptionist/*" element={<ReceptionRoutes />} />
                <Route path="/diagnostic-technician/*" element={<DiagnosticTechnicianRoutes />} />
                <Route path="/technician/*" element={<TechnicianRoutes />} />
                <Route path="/customer/*" element={<CustomerRoutes />} />
                <Route path="/inventory-manager/*" element={<InventoryManagerRoutes />} />
                <Route path="/sales-manager/*" element={<SalesManagerRoutes />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
            </ThemeProvider>
        </Router>
    );
};

export default AppRoutes;
