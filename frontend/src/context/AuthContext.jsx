// Контекст для управления состоянием авторизации

// Хранит данные пользователя, токен, функции входа/выхода/регистрации
// При загрузке страницы проверяет сохранённый токен в localStorage

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
console.log('🔧 API_URL:', API_URL);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));  // Восстанавливаем токен при загрузке

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const response = await axios.get('${API_URL}/api/auth/me');
            setUser(response.data);
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post(
                `${API_URL}/api/auth/login`, 
                { email, password },  // ← именно так, объект
                { headers: { 'Content-Type': 'application/json' } }
            );
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            setUser(user);
            return user;
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const response = await axios.post(
                `${API_URL}/api/auth/register`,
                userData,  // ← объект с полями email, password, full_name, phone, role
                { headers: { 'Content-Type': 'application/json' } }
            );
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            setUser(user);
            return user;
        } catch (error) {
            console.error('Register error:', error.response?.data || error.message);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, token, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};