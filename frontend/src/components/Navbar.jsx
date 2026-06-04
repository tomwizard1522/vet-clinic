import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    if (!user) return null;
    
    const getMenuItems = () => {
        switch (user.role) {
            case 'owner':
                return <Link to="/cabinet">📋 Личный кабинет</Link>;
            case 'doctor':
                return <Link to="/schedule">📅 Расписание</Link>;
            case 'admin':
                return <Link to="/admin">⚙️ Панель управления</Link>;
            default:
                return null;
        }
    };
    
    return (
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: '#2c3e50', color: 'white' }}>
            <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                <strong style={{ fontSize: '18px' }}>🐾 ВетКлиника</strong>
                {getMenuItems()}
            </div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <span>👤 {user.full_name} ({user.role === 'owner' ? 'Владелец' : user.role === 'doctor' ? 'Врач' : 'Администратор'})</span>
                <button onClick={handleLogout} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer' }}>
                    Выйти
                </button>
            </div>
        </nav>
    );
};

export default Navbar;