import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RequireAuth from './admin/RequireAuth';
import RequireAccess from './admin/RequireAccess';

// Code splitting (spec section 49): each page is its own chunk.
const AlbumLogin = lazy(() => import('./pages/AlbumLogin'));
const AlbumLayout = lazy(() => import('./contexts/AlbumContext'));
const AlbumHome = lazy(() => import('./pages/AlbumHome'));
const EventPage = lazy(() => import('./pages/EventPage'));
const FolderGalleryPage = lazy(() => import('./pages/FolderGalleryPage'));
const VideoGalleryPage = lazy(() => import('./pages/VideoGalleryPage'));

const AdminLogin = lazy(() => import('./admin/AdminLogin'));
const ForgotPassword = lazy(() => import('./admin/ForgotPassword'));
const ResetPassword = lazy(() => import('./admin/ResetPassword'));
const FirstLogin = lazy(() => import('./admin/FirstLogin'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const Albums = lazy(() => import('./admin/Albums'));
const CreateAlbum = lazy(() => import('./admin/CreateAlbum'));
const AlbumDetail = lazy(() => import('./admin/AlbumDetail'));
const EditAlbum = lazy(() => import('./admin/EditAlbum'));
const Analytics = lazy(() => import('./admin/Analytics'));
const Settings = lazy(() => import('./admin/Settings'));
const Profile = lazy(() => import('./admin/Profile'));
const Staff = lazy(() => import('./admin/Staff'));
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
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Landing />} />

            {/* Public album */}
            <Route path="/album/:slug/login" element={<AlbumLogin />} />
            <Route path="/album/:slug" element={<AlbumLayout />}>
              <Route index element={<AlbumHome />} />
              <Route path="videos" element={<VideoGalleryPage />} />
              <Route path="event/:eventSlug" element={<EventPage />} />
              <Route path="event/:eventSlug/folder/:folderSlug" element={<FolderGalleryPage />} />
            </Route>

            {/* Admin + staff auth */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/forgot-password" element={<ForgotPassword />} />
            <Route path="/admin/reset-password" element={<ResetPassword />} />
            {/* Forced first-login password change (authenticated, no chrome) */}
            <Route
              path="/admin/first-login"
              element={
                <RequireAuth>
                  <FirstLogin />
                </RequireAuth>
              }
            />

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
              <Route path="albums" element={<Albums />} />
              <Route path="albums/create" element={<CreateAlbum />} />
              <Route path="albums/:id" element={<AlbumDetail />} />
              <Route path="albums/:id/edit" element={<EditAlbum />} />
              <Route path="albums/:id/analytics" element={<Analytics />} />
              <Route path="google" element={<GoogleDrive />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              {/* Staff management + activity log — admins only */}
              <Route
                path="staff"
                element={
                  <RequireAccess adminOnly>
                    <Staff />
                  </RequireAccess>
                }
              />
              <Route
                path="activity"
                element={
                  <RequireAccess adminOnly>
                    <AuditLogs />
                  </RequireAccess>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
