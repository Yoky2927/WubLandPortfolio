// src/Router.jsx
import { Routes, Route } from "react-router-dom";
import App from "./App.jsx"; // Layout component
import DocumentValidator from "./pages/DocumentValidator.jsx";
import LoginRegister from "./pages/LoginRegister.jsx";
import Home from "./pages/Home.jsx"; // Import Home component

function Router() {
    return (
        <Routes>
            <Route path="/" element={<App />}>
                <Route index element={<Home />} /> {/* Home as the default route */}
            </Route>
            <Route path="/document-validator" element={<DocumentValidator />} />
            <Route path="/login-register" element={<LoginRegister />} />
        </Routes>
    );
}

export default Router;