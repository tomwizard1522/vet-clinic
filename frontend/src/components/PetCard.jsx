import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const PetCard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [pet, setPet] = useState(null);
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState([]);
    const [showAppointmentForm, setShowAppointmentForm] = useState(false);
    const [newAppointment, setNewAppointment] = useState({
        doctor_id: '',
        appointment_time: '',
        reason: ''
    });

    useEffect(() => {
        if (!id || id === 'undefined') {
            navigate('/cabinet');
            return;
        }
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
            setMedicalRecords(Array.isArray(recordsRes.data) ? recordsRes.data : []);
            setFiles(Array.isArray(filesRes.data) ? filesRes.data : []);
        } catch (error) {
            console.error('Ошибка загрузки данных питомца:', error);
            navigate('/cabinet');
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/doctors`);
            setDoctors(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Ошибка загрузки врачей:', error);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            await axios.post(`${API_URL}/api/files/upload/${id}`, formData);
            fetchPetData();
            alert('Файл загружен');
        } catch (error) {
            console.error('Ошибка загрузки файла:', error);
            alert('Ошибка загрузки файла');
        }
    };

    const handleCreateAppointment = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/appointments`, {
                pet_id: id,
                ...newAppointment
            });
            setShowAppointmentForm(false);
            setNewAppointment({ doctor_id: '', appointment_time: '', reason: '' });
            alert('Запись создана!');
        } catch (error) {
            console.error('Ошибка создания записи:', error);
            alert('Ошибка создания записи');
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (!pet) return <div>Питомец не найден</div>;
    
    const downloadFile = async (fileId, fileName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/files/download/${fileId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Ошибка скачивания');
            }
            
            // Получаем blob (бинарные данные файла)
            const blob = await response.blob();
            
            // Создаём ссылку для скачивания
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Ошибка скачивания:', error);
            alert('Ошибка скачивания файла');
        }
    };
    return (
        <div>
            <button className="btn-secondary" onClick={() => navigate(-1)}>← Назад</button>

            <div className="pet-card" style={{ marginTop: '20px' }}>
                <h1>{pet.name}</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '15px' }}>
                    <p><strong>Вид:</strong> {pet.species}</p>
                    <p><strong>Порода:</strong> {pet.breed || '—'}</p>
                    <p><strong>Вес:</strong> {pet.weight ? `${pet.weight} кг` : '—'}</p>
                    <p><strong>Владелец:</strong> {pet.owner_name}</p>
                </div>
                <button className="btn-info" style={{ marginTop: '15px' }} onClick={() => setShowAppointmentForm(!showAppointmentForm)}>
                    📅 Записаться на приём
                </button>
            </div>

            {showAppointmentForm && (
                <form className="add-pet-form" onSubmit={handleCreateAppointment} style={{ marginTop: '20px' }}>
                    <select
                        value={newAppointment.doctor_id}
                        onChange={(e) => setNewAppointment({...newAppointment, doctor_id: e.target.value})}
                        required
                    >
                        <option value="">Выберите врача</option>
                        {doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                        ))}
                    </select>
                    <input
                        type="datetime-local"
                        value={newAppointment.appointment_time}
                        onChange={(e) => setNewAppointment({...newAppointment, appointment_time: e.target.value})}
                        required
                    />
                    <textarea
                        placeholder="Причина визита"
                        value={newAppointment.reason}
                        onChange={(e) => setNewAppointment({...newAppointment, reason: e.target.value})}
                        rows="3"
                    />
                    <button type="submit" className="btn-success">Записать</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowAppointmentForm(false)}>Отмена</button>
                </form>
            )}

            <h2 style={{ marginTop: '30px' }}>Медицинская карта</h2>
            <table className="appointments-table">
                <thead>
                    <tr>
                        <th>Дата</th>
                        <th>Врач</th>
                        <th>Диагноз</th>
                        <th>Лечение</th>
                        <th>Рекомендации</th>
                    </tr>
                </thead>
                <tbody>
                    {medicalRecords.length === 0 ? (
                        <tr><td colSpan="5">Нет медицинских записей</td></tr>
                    ) : (
                        medicalRecords.map(record => (
                            <tr key={record.id}>
                                <td>{new Date(record.visit_date).toLocaleDateString()}</td>
                                <td>{record.doctor_name}</td>
                                <td>{record.diagnosis || '—'}</td>
                                <td>{record.treatment || '—'}</td>
                                <td>{record.recommendations || '—'}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <h2 style={{ marginTop: '30px' }}>Документы и анализы</h2>
            <div style={{ background: 'white', borderRadius: '10px', padding: '20px' }}>
                <label className="upload-btn">
                    + Загрузить файл
                    <input type="file" onChange={handleFileUpload} hidden />
                </label>
                {files.length === 0 ? (
                    <p>Нет загруженных файлов</p>
                ) : (
                    <ul style={{ listStyle: 'none', marginTop: '15px' }}>
                        {files.map(file => (
                            <li key={file.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>📄 {file.file_name}</span>
                                <button 
                                    className="btn-info" 
                                    onClick={() => downloadFile(file.id, file.file_name)}
                                    style={{ padding: '4px 12px' }}
                                >
                                    Скачать
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default PetCard;