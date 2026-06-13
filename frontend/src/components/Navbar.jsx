// Компонент навигационной панели
// Показывает имя пользователя, роль и меню в зависимости от роли

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    const getRoleName = () => {
        switch (user.role) {
            case 'owner': return 'Владелец';
            case 'doctor': return 'Врач';
            case 'admin': return 'Администратор';
            default: return user.role;
        }
    };

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
        <nav className="navbar">
            <div className="nav-brand">
                <strong>🐾 ВетКлиника</strong>
                {getMenuItems()}
            </div>
            <div>
                <span>👤 {user.full_name} ({getRoleName()})</span>
                <button className="logout-btn" onClick={() => { logout(); navigate('/login'); }}>
                    Выйти
                </button>
            </div>
        </nav>
    );
};

export default Navbar;