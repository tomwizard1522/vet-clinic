// Компонент страницы входа 
// При успешном входе перенаправляет в зависимости от роли пользователя

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_URL from './config';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const user = await login(email, password);
            
            switch (user.role) {
                case 'owner':
                    navigate('/cabinet');
                    break;
                case 'doctor':
                    navigate('/schedule');
                    break;
                case 'admin':
                    navigate('/admin');
                    break;
                default:
                    navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка входа. Проверьте email и пароль.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
            <div style={{ width: '400px', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', background: 'white' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>🐾 Вход в систему</h2>
                
                {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                            placeholder="example@mail.com"
                        />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Пароль:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                            placeholder="••••••"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ width: '100%', padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
                
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    Нет аккаунта? <Link to="/register" style={{ color: '#2c3e50' }}>Зарегистрироваться</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;