import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [pets, setPets] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [stats, setStats] = useState({});
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const [usersRes, petsRes, appointmentsRes] = await Promise.all([
                axios.get(`${API_URL}/api/users`),
                axios.get(`${API_URL}/api/pets`),
                axios.get(`${API_URL}/api/appointments`)
            ]);
            
            // Гарантируем, что данные — всегда массивы
            const usersData = Array.isArray(usersRes.data) ? usersRes.data : [];
            const petsData = Array.isArray(petsRes.data) ? petsRes.data : [];
            const appointmentsData = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [];
            
            setUsers(usersData);
            setPets(petsData);
            setAppointments(appointmentsData);
            
            setStats({
                totalUsers: usersData.length,
                totalPets: petsData.length,
                totalAppointments: appointmentsData.length,
                completedAppointments: appointmentsData.filter(a => a && a.status === 'completed').length,
                scheduledAppointments: appointmentsData.filter(a => a && a.status === 'scheduled').length
            });
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            setUsers([]);
            setPets([]);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (userId) => {
        if (window.confirm('Вы уверены, что хотите удалить пользователя?')) {
            try {
                await axios.delete(`${API_URL}/api/users/${userId}`);
                fetchAllData();
            } catch (error) {
                console.error('Ошибка удаления пользователя:', error);
                alert('Ошибка удаления пользователя');
            }
        }
    };

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    return (
        <div>
            <h1 style={{ marginBottom: '20px' }}>⚙️ Панель администратора</h1>
            <p style={{ marginBottom: '20px', color: '#666' }}>Добро пожаловать, {user?.full_name}</p>
            
            {/* Карточки статистики */}
            <div className="stats-grid">
                <div className="stat-card">👥 Пользователей: {stats.totalUsers || 0}</div>
                <div className="stat-card">🐾 Питомцев: {stats.totalPets || 0}</div>
                <div className="stat-card">📅 Записей: {stats.totalAppointments || 0}</div>
                <div className="stat-card">✅ Завершённых приёмов: {stats.completedAppointments || 0}</div>
            </div>
            
            {/* Вкладки */}
            <div className="admin-tabs">
                <button 
                    className={activeTab === 'users' ? 'active' : ''} 
                    onClick={() => setActiveTab('users')}
                >
                    👥 Пользователи
                </button>
                <button 
                    className={activeTab === 'pets' ? 'active' : ''} 
                    onClick={() => setActiveTab('pets')}
                >
                    🐾 Питомцы
                </button>
                <button 
                    className={activeTab === 'appointments' ? 'active' : ''} 
                    onClick={() => setActiveTab('appointments')}
                >
                    📅 Записи
                </button>
            </div>
            
            {/* Таблица пользователей */}
            {activeTab === 'users' && (
                <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left' }}>ФИО</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Телефон</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Роль</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center' }}>Нет пользователей</td>
                                </tr>
                            ) : (
                                users.filter(u => u && u.id).map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '12px' }}>{u.full_name || '—'}</td>
                                        <td style={{ padding: '12px' }}>{u.email || '—'}</td>
                                        <td style={{ padding: '12px' }}>{u.phone || '—'}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{ 
                                                padding: '4px 8px', 
                                                borderRadius: '5px', 
                                                fontSize: '12px',
                                                background: u.role === 'admin' ? '#e74c3c' : u.role === 'doctor' ? '#3498db' : '#27ae60',
                                                color: 'white'
                                            }}>
                                                {u.role === 'admin' ? 'Админ' : u.role === 'doctor' ? 'Врач' : 'Владелец'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <button 
                                                className="btn-danger" 
                                                onClick={() => deleteUser(u.id)}
                                                style={{ padding: '5px 10px' }}
                                            >
                                                Удалить
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Таблица питомцев */}
            {activeTab === 'pets' && (
                <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Кличка</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Вид</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Порода</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Владелец</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pets.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center' }}>Нет питомцев</td>
                                </tr>
                            ) : (
                                pets.filter(p => p && p.id).map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '12px' }}>{p.name || '—'}</td>
                                        <td style={{ padding: '12px' }}>{p.species || '—'}</td>
                                        <td style={{ padding: '12px' }}>{p.breed || '—'}</td>
                                        <td style={{ padding: '12px' }}>{p.owner_name || '—'}</td>
                                        <td style={{ padding: '12px' }}>
                                            <Link to={`/pet/${p.id}`}>
                                                <button className="btn-info" style={{ padding: '5px 10px' }}>Просмотр</button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Таблица записей */}
            {activeTab === 'appointments' && (
                <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Дата и время</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Питомец</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Владелец</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Врач</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center' }}>Нет записей</td>
                                </tr>
                            ) : (
                                appointments.filter(a => a && a.id).map(a => (
                                    <tr key={a.id} style={{ borderBottom: '1px solid #ddd' }}>
                                        <td style={{ padding: '12px' }}>{a.appointment_time ? new Date(a.appointment_time).toLocaleString() : '—'}</td>
                                        <td style={{ padding: '12px' }}>{a.pet_name || '—'}</td>
                                        <td style={{ padding: '12px' }}>{a.owner_name || '—'}</td>
                                        <td style={{ padding: '12px' }}>{a.doctor_name || '—'}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{ 
                                                padding: '4px 8px', 
                                                borderRadius: '5px', 
                                                fontSize: '12px',
                                                background: a.status === 'scheduled' ? '#f39c12' : a.status === 'completed' ? '#27ae60' : '#e74c3c',
                                                color: 'white'
                                            }}>
                                                {a.status === 'scheduled' ? 'Запланирован' : a.status === 'completed' ? 'Завершён' : 'Отменён'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;