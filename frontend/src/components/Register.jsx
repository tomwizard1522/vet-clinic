// Компонент страницы регистрации 

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_URL from './config';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        phone: '',
        role: 'owner'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают.');
            return;
        }
        
        if (formData.password.length < 6) {
            setError('Пароль должен содержать минимум 6 символов.');
            return;
        }
        
        setLoading(true);
        
        try {
            const { confirmPassword, ...userData } = formData;
            await register(userData);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка регистрации. Попробуйте ещё раз.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
            <div style={{ width: '450px', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', background: 'white' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>🐾 Регистрация</h2>
                
                {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ФИО:</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Телефон:</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                            placeholder="+7 (999) 123-45-67"
                        />
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Пароль (мин. 6 символов):</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Подтверждение пароля:</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Роль:</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                        >
                            <option value="owner">Владелец питомца</option>
                        </select>
                        <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>Для регистрации как врач или администратор обратитесь к администратору системы.</small>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ width: '100%', padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
                    >
                        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                </form>
                
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    Уже есть аккаунт? <Link to="/login" style={{ color: '#2c3e50' }}>Войти</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;