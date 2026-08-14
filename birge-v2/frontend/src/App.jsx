import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import QrScanner from './pages/QrScanner';
import ImportStudents from './pages/ImportStudents';
import EventsList from './pages/EventsList';
import VolunteerPublicProfile from './pages/VolunteerPublicProfile';
import EventParticipants from './pages/EventParticipants';
import InstitutionReport from './pages/InstitutionReport';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Загрузка...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/profile" />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/organizer" element={
            <ProtectedRoute allowedRoles={['organization', 'educational_institution']}>
              <OrganizerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/events/create" element={
            <ProtectedRoute allowedRoles={['organization', 'educational_institution']}>
              <CreateEvent />
            </ProtectedRoute>
          } />
          <Route path="/scan" element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <QrScanner />
            </ProtectedRoute>
          } />
          <Route path="/institutions/import" element={
            <ProtectedRoute allowedRoles={['educational_institution']}>
              <ImportStudents />
            </ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <EventsList />
            </ProtectedRoute>
          } />
          <Route path="/volunteer/:id" element={<VolunteerPublicProfile />} />
          <Route path="/events/:id/participants" element={
            <ProtectedRoute allowedRoles={['organization', 'educational_institution']}>
              <EventParticipants />
            </ProtectedRoute>
          } />
          <Route path="/institutions/report" element={
            <ProtectedRoute allowedRoles={['educational_institution']}>
              <InstitutionReport />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
