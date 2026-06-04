import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

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
            const response = await axios.get('http://localhost:5000/api/auth/me');
            setUser(response.data);
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            // Если токен невалидный — удаляем его
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setToken(token);
        setUser(user);
        return user;
    };

    const register = async (userData) => {
        const response = await axios.post('http://localhost:5000/api/auth/register', userData);
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setToken(token);
        setUser(user);
        return user;
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