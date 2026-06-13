// Панель администратора
// просмотр статистики (количество пользователей, питомцев, записей)
// управление пользователями (просмотр, удаление)
// просмотр всех питомцев (с переходом в карточку)
// просмотр всех записей

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from './config';

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
                axios.get('${API_URL}/api/users'),
                axios.get('${API_URL}/api/pets'),
                axios.get('${API_URL}/api/appointments')
            ]);
            setUsers(usersRes.data);
            setPets(petsRes.data);
            setAppointments(appointmentsRes.data);
            
            setStats({
                totalUsers: usersRes.data.length,
                totalPets: petsRes.data.length,
                totalAppointments: appointmentsRes.data.length,
                completedAppointments: appointmentsRes.data.filter(a => a.status === 'completed').length,
                scheduledAppointments: appointmentsRes.data.filter(a => a.status === 'scheduled').length
            });
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
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

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка...</div>;

    return (
        <div>
            <h1 style={{ marginBottom: '20px' }}>⚙️ Панель администратора</h1>
            <p style={{ marginBottom: '20px', color: '#666' }}>Добро пожаловать, {user?.full_name}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                <div style={{ background: '#3498db', color: 'white', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalUsers}</div>
                    <div>Пользователей</div>
                </div>
                <div style={{ background: '#27ae60', color: 'white', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalPets}</div>
                    <div>Питомцев</div>
                </div>
                <div style={{ background: '#f39c12', color: 'white', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.totalAppointments}</div>
                    <div>Записей</div>
                </div>
                <div style={{ background: '#9b59b6', color: 'white', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.completedAppointments}</div>
                    <div>Завершённых приёмов</div>
                </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                <button onClick={() => setActiveTab('users')} style={{ padding: '10px 20px', background: activeTab === 'users' ? '#2c3e50' : '#ecf0f1', color: activeTab === 'users' ? 'white' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>👥 Пользователи</button>
                <button onClick={() => setActiveTab('pets')} style={{ padding: '10px 20px', background: activeTab === 'pets' ? '#2c3e50' : '#ecf0f1', color: activeTab === 'pets' ? 'white' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>🐾 Питомцы</button>
                <button onClick={() => setActiveTab('appointments')} style={{ padding: '10px 20px', background: activeTab === 'appointments' ? '#2c3e50' : '#ecf0f1', color: activeTab === 'appointments' ? 'white' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>📅 Записи</button>
            </div>
            
            {activeTab === 'users' && (
                <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#2c3e50', color: 'white' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left' }}>ФИО</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Телефон</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Роль</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={{ padding: '12px' }}>{u.full_name}</td>
                                    <td style={{ padding: '12px' }}>{u.email}</td>
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
                                        <button onClick={() => deleteUser(u.id)} style={{ background: '#e74c3c', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Удалить</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Исправленная таблица питомцев */}
            {activeTab === 'pets' && (
                <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#2c3e50', color: 'white' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Кличка</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Вид</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Порода</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Владелец</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pets.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={{ padding: '12px' }}>{p.name}</td>
                                    <td style={{ padding: '12px' }}>{p.species}</td>
                                    <td style={{ padding: '12px' }}>{p.breed || '—'}</td>
                                    <td style={{ padding: '12px' }}>{p.owner_name}</td>
                                    <td style={{ padding: '12px' }}>
                                        <Link to={`/pet/${p.id}`}>
                                            <button style={{ background: '#3498db', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Просмотр</button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {activeTab === 'appointments' && (
                <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#2c3e50', color: 'white' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Дата и время</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Питомец</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Владелец</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Врач</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map(a => (
                                <tr key={a.id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={{ padding: '12px' }}>{new Date(a.appointment_time).toLocaleString()}</td>
                                    <td style={{ padding: '12px' }}>{a.pet_name}</td>
                                    <td style={{ padding: '12px' }}>{a.owner_name}</td>
                                    <td style={{ padding: '12px' }}>{a.doctor_name}</td>
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
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;