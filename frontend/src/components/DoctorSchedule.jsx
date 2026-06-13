// Расписание приёмов для врача
// Отображает записи на сегодня и предстоящие записи
// Позволяет врачу завершить приём и заполнить медицинскую карту

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DoctorSchedule = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [formData, setFormData] = useState({
        diagnosis: '',
        treatment: '',
        recommendations: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/appointments');
            setAppointments(response.data);
        } catch (error) {
            console.error('Ошибка загрузки расписания:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (appointment) => {
        setSelectedAppointment(appointment);
        setFormData({ diagnosis: '', treatment: '', recommendations: '' });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedAppointment(null);
        setFormData({ diagnosis: '', treatment: '', recommendations: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.diagnosis.trim()) {
            alert('Пожалуйста, укажите диагноз');
            return;
        }
        
        setSubmitting(true);
        
        try {
            await axios.patch(`http://localhost:5000/api/appointments/${selectedAppointment.id}/status`, { status: 'completed' });
            
            await axios.post('http://localhost:5000/api/medical-records', {
                pet_id: selectedAppointment.pet_id,
                appointment_id: selectedAppointment.id,
                visit_date: new Date().toISOString().split('T')[0],
                diagnosis: formData.diagnosis,
                treatment: formData.treatment,
                recommendations: formData.recommendations
            });
            
            alert('Приём успешно завершён! Медицинская карта заполнена.');
            closeModal();
            fetchAppointments();
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при завершении приёма: ' + (error.response?.data?.error || 'Неизвестная ошибка'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка...</div>;

    const today = new Date().toDateString();
    const todayAppointments = appointments.filter(a => new Date(a.appointment_time).toDateString() === today);
    const upcomingAppointments = appointments.filter(a => new Date(a.appointment_time) > new Date() && new Date(a.appointment_time).toDateString() !== today);

    return (
        <div>
            <h1 style={{ marginBottom: '20px' }}>📅 Расписание приёмов</h1>
            <p style={{ marginBottom: '20px', color: '#666' }}>Добро пожаловать, {user?.full_name}</p>
            
            <h2 style={{ marginBottom: '15px', color: '#e67e22' }}>Сегодня ({today})</h2>
            <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', marginBottom: '30px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#2c3e50', color: 'white' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Время</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Питомец</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Владелец</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Причина</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Статус</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {todayAppointments.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '30px', textAlign: 'center' }}>Нет записей на сегодня</td>
                            </tr>
                        ) : (
                            todayAppointments.map(apt => (
                                <tr key={apt.id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={{ padding: '12px' }}>{new Date(apt.appointment_time).toLocaleTimeString()}</td>
                                    <td style={{ padding: '12px' }}>{apt.pet_name}</td>
                                    <td style={{ padding: '12px' }}>{apt.owner_name}</td>
                                    <td style={{ padding: '12px' }}>{apt.reason || '—'}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ 
                                            padding: '4px 8px', 
                                            borderRadius: '5px', 
                                            fontSize: '12px',
                                            background: apt.status === 'scheduled' ? '#f39c12' : apt.status === 'completed' ? '#27ae60' : '#e74c3c',
                                            color: 'white'
                                        }}>
                                            {apt.status === 'scheduled' ? 'Запланирован' : apt.status === 'completed' ? 'Завершён' : 'Отменён'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {apt.status === 'scheduled' && (
                                            <button 
                                                onClick={() => openModal(apt)}
                                                style={{ 
                                                    background: '#27ae60', 
                                                    color: 'white', 
                                                    padding: '5px 10px', 
                                                    border: 'none', 
                                                    borderRadius: '5px', 
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ✓ Заполнить карту
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <h2 style={{ marginBottom: '15px' }}>Предстоящие записи</h2>
            <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#2c3e50', color: 'white' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Дата и время</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Питомец</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Владелец</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Причина</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        {upcomingAppointments.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '30px', textAlign: 'center' }}>Нет предстоящих записей</td>
                            </tr>
                        ) : (
                            upcomingAppointments.map(apt => (
                                <tr key={apt.id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={{ padding: '12px' }}>{new Date(apt.appointment_time).toLocaleString()}</td>
                                    <td style={{ padding: '12px' }}>{apt.pet_name}</td>
                                    <td style={{ padding: '12px' }}>{apt.owner_name}</td>
                                    <td style={{ padding: '12px' }}>{apt.reason || '—'}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '12px', background: '#f39c12', color: 'white' }}>
                                            Запланирован
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '10px',
                        padding: '25px',
                        width: '500px',
                        maxWidth: '90%',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
                    }}>
                        <h2 style={{ marginBottom: '15px', color: '#2c3e50' }}>📝 Заполнение медицинской карты</h2>
                        <p style={{ marginBottom: '15px', color: '#666' }}>
                            Питомец: <strong>{selectedAppointment?.pet_name}</strong><br/>
                            Владелец: <strong>{selectedAppointment?.owner_name}</strong>
                        </p>
                        
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Диагноз *</label>
                                <textarea
                                    value={formData.diagnosis}
                                    onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                                    required
                                    rows="3"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px', fontFamily: 'inherit' }}
                                    placeholder="Укажите диагноз..."
                                />
                            </div>
                            
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Назначенное лечение</label>
                                <textarea
                                    value={formData.treatment}
                                    onChange={(e) => setFormData({...formData, treatment: e.target.value})}
                                    rows="3"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px', fontFamily: 'inherit' }}
                                    placeholder="Препараты, процедуры..."
                                />
                            </div>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Рекомендации</label>
                                <textarea
                                    value={formData.recommendations}
                                    onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                                    rows="3"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px', fontFamily: 'inherit' }}
                                    placeholder="Диета, уход, повторный приём..."
                                />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    style={{ padding: '8px 16px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ padding: '8px 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}
                                >
                                    {submitting ? 'Сохранение...' : 'Завершить приём'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorSchedule;