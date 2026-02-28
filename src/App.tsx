import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import PostTask from "./pages/PostTask";
import TaskDetail from "./pages/TaskDetail";
import Agents from "./pages/Agents";
import Profile from "./pages/Profile";
import { MiniAppProvider } from "./lib/miniapp";

function App() {
  return (
    <MiniAppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-dark">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/post" element={<PostTask />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </BrowserRouter>
    </MiniAppProvider>
  );
}

export default App;
