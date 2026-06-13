// Полная карточка питомца
// основная информация о питомце
// медицинская карта (история посещений)
// список загруженных файлов
// форма записи на приём
// форма загрузки файлов

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PetCard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [pet, setPet] = useState(null);
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showAppointmentForm, setShowAppointmentForm] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [newAppointment, setNewAppointment] = useState({
        doctor_id: '',
        appointment_time: '',
        reason: ''
    });

    useEffect(() => {
        fetchPetData();
        fetchDoctors();
    }, [id]);

    const fetchPetData = async () => {
        try {
            const [petRes, recordsRes, filesRes] = await Promise.all([
                axios.get(`${API_URL}/api/pets/${id}`),
                axios.get(`${API_URL}/api/medical-records/pet/${id}`),
                axios.get(`${API_URL}/api/files/pet/${id}`)
            ]);
            setPet(petRes.data);
            setMedicalRecords(recordsRes.data);
            setFiles(filesRes.data);
        } catch (error) {
            console.error('Ошибка загрузки данных питомца:', error);
            navigate('/cabinet');
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await axios.get('${API_URL}/api/doctors');
            setDoctors(response.data);
        } catch (error) {
            console.error('Ошибка загрузки врачей:', error);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        setUploading(true);
        try {
            await axios.post(`${API_URL}/api/files/upload/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchPetData();
        } catch (error) {
            console.error('Ошибка загрузки файла:', error);
            alert('Ошибка загрузки файла');
        } finally {
            setUploading(false);
        }
    };

    const handleCreateAppointment = async (e) => {
        e.preventDefault();
        try {
            await axios.post('${API_URL}/api/appointments', {
                pet_id: id,
                ...newAppointment
            });
            setShowAppointmentForm(false);
            setNewAppointment({ doctor_id: '', appointment_time: '', reason: '' });
            alert('Запись успешно создана!');
        } catch (error) {
            console.error('Ошибка создания записи:', error);
            alert('Ошибка создания записи');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка...</div>;
    if (!pet) return <div>Питомец не найден</div>;

    return (
        <div>
            <button onClick={() => navigate(-1)} style={{ background: '#95a5a6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}>← Назад</button>
            
            <div style={{ background: 'white', borderRadius: '10px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h1 style={{ marginBottom: '15px' }}>{pet.name}</h1>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                            <p><strong>Вид:</strong> {pet.species}</p>
                            <p><strong>Порода:</strong> {pet.breed || '—'}</p>
                            <p><strong>Пол:</strong> {pet.gender === 'male' ? 'Мальчик' : 'Девочка'}</p>
                            <p><strong>Вес:</strong> {pet.weight ? `${pet.weight} кг` : '—'}</p>
                            <p><strong>Дата рождения:</strong> {pet.birth_date || '—'}</p>
                            <p><strong>Владелец:</strong> {pet.owner_name}</p>
                        </div>
                    </div>
                    <div>
                        <button onClick={() => setShowAppointmentForm(!showAppointmentForm)} style={{ background: '#3498db', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                            📅 Записаться на приём
                        </button>
                    </div>
                </div>
                
                {pet.medical_notes && (
                    <div style={{ marginTop: '15px', padding: '10px', background: '#ecf0f1', borderRadius: '5px' }}>
                        <strong>Общие заметки:</strong> {pet.medical_notes}
                    </div>
                )}
                {pet.chronic_diseases && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#fef9e7', borderRadius: '5px' }}>
                        <strong>Хронические заболевания:</strong> {pet.chronic_diseases}
                    </div>
                )}
                {pet.allergies && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#fdedec', borderRadius: '5px' }}>
                        <strong>Аллергии:</strong> {pet.allergies}
                    </div>
                )}
            </div>
            
            {showAppointmentForm && (
                <div style={{ background: '#ecf0f1', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
                    <h3>Запись на приём для {pet.name}</h3>
                    <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <select
                            value={newAppointment.doctor_id}
                            onChange={(e) => setNewAppointment({...newAppointment, doctor_id: e.target.value})}
                            required
                            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                        >
                            <option value="">Выберите врача</option>
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.full_name} ({doc.specialization || 'Терапевт'})</option>
                            ))}
                        </select>
                        <input
                            type="datetime-local"
                            value={newAppointment.appointment_time}
                            onChange={(e) => setNewAppointment({...newAppointment, appointment_time: e.target.value})}
                            required
                            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                        <textarea
                            placeholder="Причина визита"
                            value={newAppointment.reason}
                            onChange={(e) => setNewAppointment({...newAppointment, reason: e.target.value})}
                            rows="3"
                            style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowAppointmentForm(false)} style={{ padding: '10px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Отмена</button>
                            <button type="submit" style={{ padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Записать</button>
                        </div>
                    </form>
                </div>
            )}
            
            <h2 style={{ marginBottom: '15px' }}>Медицинская карта</h2>
            <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#2c3e50', color: 'white' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Дата</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Врач</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Диагноз</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Лечение</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Рекомендации</th>
                        </tr>
                    </thead>
                    <tbody>
                        {medicalRecords.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '30px', textAlign: 'center' }}>Нет медицинских записей</td>
                            </tr>
                        ) : (
                            medicalRecords.map(record => (
                                <tr key={record.id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={{ padding: '12px' }}>{new Date(record.visit_date).toLocaleDateString()}</td>
                                    <td style={{ padding: '12px' }}>{record.doctor_name}</td>
                                    <td style={{ padding: '12px' }}>{record.diagnosis || '—'}</td>
                                    <td style={{ padding: '12px' }}>{record.treatment || '—'}</td>
                                    <td style={{ padding: '12px' }}>{record.recommendations || '—'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <h2 style={{ marginBottom: '15px' }}>Документы и анализы</h2>
            <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'inline-block', background: '#3498db', color: 'white', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}>
                        {uploading ? 'Загрузка...' : '+ Загрузить файл'}
                        <input type="file" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
                    </label>
                </div>
                
                {files.length === 0 ? (
                    <p style={{ color: '#666' }}>Нет загруженных файлов</p>
                ) : (
                    <ul style={{ listStyle: 'none' }}>
                        {files.map(file => (
                            <li key={file.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>📄 {file.file_name}</span>
                                <a href={`${API_URL}/api/files/download/${file.id}`} download style={{ color: '#3498db', textDecoration: 'none' }}>Скачать</a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default PetCard;