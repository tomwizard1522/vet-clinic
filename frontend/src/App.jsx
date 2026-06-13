import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import OwnerCabinet from './components/OwnerCabinet';
import DoctorSchedule from './components/DoctorSchedule';
import AdminPanel from './components/AdminPanel';
import PetCard from './components/PetCard';
import Navbar from './components/Navbar';

const PrivateRoute = ({ children, allowedRoles }) => {
    const { user, loading, token } = useAuth();
    
    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }
    
    if (!user && !token) {
        return <Navigate to="/login" />;
    }
    
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'owner') return <Navigate to="/cabinet" />;
        if (user.role === 'doctor') return <Navigate to="/schedule" />;
        if (user.role === 'admin') return <Navigate to="/admin" />;
        return <Navigate to="/login" />;
    }
    
    return children;
};

const PublicRoute = ({ children }) => {
    const { user, loading, token } = useAuth();
    
    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }
    
    if (user && token) {
        if (user.role === 'owner') return <Navigate to="/cabinet" />;
        if (user.role === 'doctor') return <Navigate to="/schedule" />;
        if (user.role === 'admin') return <Navigate to="/admin" />;
    }
    
    return children;
};

function AppRoutes() {
    const { user } = useAuth();
    
    return (
        <>
            <Navbar />
            <div className="container">
                <Routes>
                    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                    
                    <Route path="/cabinet" element={<PrivateRoute allowedRoles={['owner']}><OwnerCabinet /></PrivateRoute>} />
                    <Route path="/pet/:id" element={<PrivateRoute allowedRoles={['owner', 'doctor', 'admin']}><PetCard /></PrivateRoute>} />
                    <Route path="/schedule" element={<PrivateRoute allowedRoles={['doctor', 'admin']}><DoctorSchedule /></PrivateRoute>} />
                    <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']}><AdminPanel /></PrivateRoute>} />
                    
                    <Route path="/" element={<Navigate to={user ? (user.role === 'owner' ? '/cabinet' : user.role === 'doctor' ? '/schedule' : '/admin') : '/login'} />} />
                </Routes>
            </div>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;