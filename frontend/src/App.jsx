import { Outlet } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import GridOverlay from "./components/GridOverlay";
import './telegram-theme.css';

function App() {
  return (
    <ThemeProvider>
      <div className="relative min-h-screen overflow-x-hidden">
        <Outlet /> {/* Renders Home or other routed components */}
      </div>
    </ThemeProvider>
  );
}

export default App;