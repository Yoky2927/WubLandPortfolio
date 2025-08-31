
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import GridOverlay from "./components/GridOverlay";
import FloatingElements from "./components/FloatingElements";
import ThemeToggle from "./components/ThemeToggle.jsx";
import Loader from "./components/Loader";

function App() {
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        document.body.classList.remove("light", "dark");
        document.body.classList.add(theme);
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
    };

    return (
        <div className="relative min-h-screen overflow-x-hidden">
            {isLoading && <Loader theme={theme} />}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <Outlet /> {/* Renders Home or other routed components */}
            <FloatingElements theme={theme} />
        </div>
    );
}

export default App;