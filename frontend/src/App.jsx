/**
 * App.jsx - Главный компонент приложения
 * 
 * Отвечает за маршрутизацию (React Router) и защиту страниц
 * - PrivateRoute: доступ только для авторизованных с определённой ролью
 * - PublicRoute: для страниц логина/регистрации (редирект если уже залогинен)
 */

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

// Компонент для защиты приватных маршрутов
const PrivateRoute = ({ children, allowedRoles }) => {
    const { user, loading, token } = useAuth();
    
    // Пока идёт загрузка — показываем индикатор
    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: '#2c3e50' }}>Загрузка...</div>;
    }
    
    // Нет пользователя и нет токена — отправляем на логин
    if (!user && !token) {
        return <Navigate to="/login" />;
    }
    
    // Пользователь есть, но роль не подходит — редирект на его главную
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'owner') return <Navigate to="/cabinet" />;
        if (user.role === 'doctor') return <Navigate to="/schedule" />;
        if (user.role === 'admin') return <Navigate to="/admin" />;
        return <Navigate to="/login" />;
    }
    
    return children;
};

// Компонент для публичных маршрутов (если залогинен — редирект)
const PublicRoute = ({ children }) => {
    const { user, loading, token } = useAuth();
    
    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: '#2c3e50' }}>Загрузка...</div>;
    }
    
    // Если залогинен — редирект на его страницу
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
                    {/* Публичные маршруты */}
                    <Route path="/login" element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    } />
                    <Route path="/register" element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    } />
                    
                    {/* Приватные маршруты */}
                    <Route path="/cabinet" element={
                        <PrivateRoute allowedRoles={['owner']}>
                            <OwnerCabinet />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/pet/:id" element={
                        <PrivateRoute allowedRoles={['owner', 'doctor', 'admin']}>
                            <PetCard />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/schedule" element={
                        <PrivateRoute allowedRoles={['doctor', 'admin']}>
                            <DoctorSchedule />
                        </PrivateRoute>
                    } />
                    
                    <Route path="/admin" element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <AdminPanel />
                        </PrivateRoute>
                    } />
                    
                    {/* Корневой маршрут — редирект в зависимости от роли */}
                    <Route path="/" element={
                        <PrivateRoute allowedRoles={['owner', 'doctor', 'admin']}>
                            {user?.role === 'owner' && <Navigate to="/cabinet" />}
                            {user?.role === 'doctor' && <Navigate to="/schedule" />}
                            {user?.role === 'admin' && <Navigate to="/admin" />}
                            <Navigate to="/login" />
                        </PrivateRoute>
                    } />
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