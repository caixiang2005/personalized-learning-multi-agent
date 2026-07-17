/**
 * @file App.tsx
 * @description 应用路由：登录页 + 受保护的主布局与子页面。
 * @backend 无
 */
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import AppMeshBackground from "./components/background/AppMeshBackground";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import AuthBootstrap from "./components/auth/AuthBootstrap";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Scan from "./pages/Scan";
import DailyPlan from "./pages/DailyPlan";
import LearningPath from "./pages/LearningPath";
import PathPlan from "./pages/PathPlan";
import PathDetail from "./pages/PathDetail";
import ResourceDetail from "./pages/ResourceDetail";
import ExercisePage from "./pages/ExercisePage";
import ExerciseBank from "./pages/ExerciseBank";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import DatabaseAdmin from "./pages/DatabaseAdmin";
import Account from "./pages/Account";
import AccountSecurity from "./pages/AccountSecurity";
import NotFound from "./pages/NotFound";

/** 只在受保护页面显示网格背景 */
function MeshBackgroundGuard() {
  const loc = useLocation();
  const publicPaths = ["/", "/login", "/register", "/reset-password"];
  if (publicPaths.includes(loc.pathname)) return null;
  return <AppMeshBackground />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <MeshBackgroundGuard />
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/account/security"
          element={
            <ProtectedRoute>
              <AccountSecurity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/profile-build" element={<Chat />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/plan" element={<DailyPlan />} />
          <Route path="/path" element={<LearningPath />} />
          <Route path="/path/plan" element={<PathPlan />} />
          <Route path="/path/view" element={<PathDetail />} />
          <Route path="/resource/:id" element={<ResourceDetail />} />
          {/* bank 必须在 :id 之前，否则会被匹配成 exerciseId=bank */}
          <Route path="/exercise/bank" element={<ExerciseBank />} />
          <Route path="/exercise/:id" element={<ExercisePage />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin/db" element={<DatabaseAdmin />} />
        </Route>
        <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
}
