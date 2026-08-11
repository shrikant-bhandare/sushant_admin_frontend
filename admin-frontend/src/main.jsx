import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./index.css"; // Tailwind styles
import SocialMediaChats from "./socialMedia/SocialMediaChats";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        {/* <ThemeProvider> */}
            <App />
            {/* <Routes>
                <Route path="/social-media" element={<SocialMediaChats />} />
            </Routes> */}
        {/* </ThemeProvider> */}
    </StrictMode>
);
