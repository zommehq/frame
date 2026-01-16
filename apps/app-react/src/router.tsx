import { Route, Routes } from "react-router-dom";
import About from "./pages/About";
import Analytics from "./pages/Analytics";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Tasks from "./pages/Tasks";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Home />} path="/" />
      <Route element={<Tasks />} path="/tasks" />
      <Route element={<Analytics />} path="/analytics" />
      <Route element={<Settings />} path="/settings" />
      <Route element={<About />} path="/about" />
      <Route element={<Contact />} path="/contact" />
    </Routes>
  );
}
