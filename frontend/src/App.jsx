import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import RequireAuth from './admin/RequireAuth';
import RequireRole from './admin/RequireRole';

// Code splitting (spec section 49): each page is its own chunk.
const AlbumLogin = lazy(() => import('./pages/AlbumLogin'));
const AlbumLayout = lazy(() => import('./contexts/AlbumContext'));
const AlbumHome = lazy(() => import('./pages/AlbumHome'));
const EventPage = lazy(() => import('./pages/EventPage'));
const FolderGalleryPage = lazy(() => import('./pages/FolderGalleryPage'));

const AdminLogin = lazy(() => import('./admin/AdminLogin'));
const ForgotPassword = lazy(() => import('./admin/ForgotPassword'));
const ResetPassword = lazy(() => import('./admin/ResetPassword'));
const FirstLoginPassword = lazy(() => import('./admin/FirstLoginPassword'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const Albums = lazy(() => import('./admin/Albums'));
const CreateAlbum = lazy(() => import('./admin/CreateAlbum'));
const AlbumDetail = lazy(() => import('./admin/AlbumDetail'));
const EditAlbum = lazy(() => import('./admin/EditAlbum'));
const Analytics = lazy(() => import('./admin/Analytics'));
const Settings = lazy(() => import('./admin/Settings'));
const Profile = lazy(() => import('./admin/Profile'));
const StaffList = lazy(() => import('./admin/StaffList'));
const StaffForm = lazy(() => import('./admin/StaffForm'));
const Roles = lazy(() => import('./admin/Roles'));
const AuditLogs = lazy(() => import('./admin/AuditLogs'));
const GoogleDrive = lazy(() => import('./admin/GoogleDrive'));
const Landing = lazy(() => import('./pages/Landing'));

function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent opacity-40" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<Landing />} />

              {/* Public album */}
              <Route path="/album/:slug/login" element={<AlbumLogin />} />
              <Route path="/album/:slug" element={<AlbumLayout />}>
                <Route index element={<AlbumHome />} />
                <Route path="event/:eventSlug" element={<EventPage />} />
                <Route path="event/:eventSlug/folder/:folderSlug" element={<FolderGalleryPage />} />
              </Route>

              {/* Admin / staff auth (public) */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/forgot-password" element={<ForgotPassword />} />
              <Route path="/admin/reset-password" element={<ResetPassword />} />

              {/* First-login password change (authenticated but outside the layout) */}
              <Route
                path="/admin/first-login"
                element={
                  <RequireAuth>
                    <FirstLoginPassword />
                  </RequireAuth>
                }
              />

              {/* Admin / staff dashboards (role-aware) */}
              <Route
                path="/admin"
                element={
                  <RequireAuth>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />

                <Route
                  path="albums"
                  element={<RequireRole permission="albums.view"><Albums /></RequireRole>}
                />
                <Route
                  path="albums/create"
                  element={<RequireRole permission="albums.create"><CreateAlbum /></RequireRole>}
                />
                <Route path="albums/:id" element={<RequireRole permission="albums.view"><AlbumDetail /></RequireRole>} />
                <Route path="albums/:id/edit" element={<RequireRole permission="albums.update"><EditAlbum /></RequireRole>} />
                <Route path="albums/:id/analytics" element={<RequireRole permission="albums.view"><Analytics /></RequireRole>} />

                {/* Staff management */}
                <Route path="staff" element={<RequireRole permission="staff.view"><StaffList /></RequireRole>} />
                <Route path="staff/new" element={<RequireRole permission="staff.create"><StaffForm /></RequireRole>} />
                <Route path="staff/:id" element={<RequireRole permission="staff.view"><StaffForm /></RequireRole>} />

                {/* Admin-only */}
                <Route path="roles" element={<RequireRole roles={['super_admin']}><Roles /></RequireRole>} />
                <Route path="activity" element={<RequireRole roles={['super_admin']}><AuditLogs /></RequireRole>} />

                <Route path="google" element={<RequireRole permission="albums.view"><GoogleDrive /></RequireRole>} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
