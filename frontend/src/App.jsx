import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SearchCase from "./pages/SearchCase";
import UploadPDF from "./pages/UploadPDF";
import SummaryPage from "./pages/SummaryPage";
import AudioPage from "./pages/AudioPage";
import NotesPage from "./pages/NotesPage";
import HistoryPage from "./pages/HistoryPage";

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/search" element={<RequireAuth><SearchCase /></RequireAuth>} />
        <Route path="/upload" element={<RequireAuth><UploadPDF /></RequireAuth>} />
        <Route path="/summary" element={<RequireAuth><SummaryPage /></RequireAuth>} />
        <Route path="/audio" element={<RequireAuth><AudioPage /></RequireAuth>} />
        <Route path="/notes" element={<RequireAuth><NotesPage /></RequireAuth>} />
        <Route path="/history" element={<RequireAuth><HistoryPage /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
