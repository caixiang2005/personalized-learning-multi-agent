/**
 * @file App.tsx
 * @description 应用路由：登录页 + 受保护的主布局与子页面。
 * @backend 无
 */
import { BrowserRouter, Route, Routes } from "react-router-dom";
import BookSeaBackground from "./components/background/BookSeaBackground";
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
import LearningPath from "./pages/LearningPath";
import ResourceDetail from "./pages/ResourceDetail";
import ExercisePage from "./pages/ExercisePage";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <BookSeaBackground />
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/path" element={<LearningPath />} />
          <Route path="/resource/:id" element={<ResourceDetail />} />
          <Route path="/exercise/:id" element={<ExercisePage />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
}
