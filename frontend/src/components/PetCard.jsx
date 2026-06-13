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
    const [newAppointment, setNewAppointment] = useState({ doctor_id: '', appointment_time: '', reason: '' });

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
        } catch (error) {
            console.error('Ошибка загрузки файла:', error);
        }
    };

    const handleCreateAppointment = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/appointments`, { pet_id: id, ...newAppointment });
            setShowAppointmentForm(false);
            setNewAppointment({ doctor_id: '', appointment_time: '', reason: '' });
            alert('Запись создана!');
        } catch (error) {
            console.error('Ошибка создания записи:', error);
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (!pet) return <div>Питомец не найден</div>;

    return (
        <div>
            <button onClick={() => navigate(-1)}>← Назад</button>
            <h1>{pet.name}</h1>
            <div className="pet-info"><p>Вид: {pet.species}</p><p>Порода: {pet.breed || '—'}</p><p>Вес: {pet.weight ? `${pet.weight} кг` : '—'}</p><p>Владелец: {pet.owner_name}</p></div>
            <button onClick={() => setShowAppointmentForm(!showAppointmentForm)}>📅 Записаться на приём</button>
            
            {showAppointmentForm && (
                <form onSubmit={handleCreateAppointment}>
                    <select value={newAppointment.doctor_id} onChange={(e) => setNewAppointment({...newAppointment, doctor_id: e.target.value})} required>
                        <option value="">Выберите врача</option>
                        {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.full_name}</option>)}
                    </select>
                    <input type="datetime-local" value={newAppointment.appointment_time} onChange={(e) => setNewAppointment({...newAppointment, appointment_time: e.target.value})} required />
                    <textarea placeholder="Причина" value={newAppointment.reason} onChange={(e) => setNewAppointment({...newAppointment, reason: e.target.value})} />
                    <button type="submit">Записать</button>
                    <button type="button" onClick={() => setShowAppointmentForm(false)}>Отмена</button>
                </form>
            )}
            
            <h2>Медицинская карта</h2>
            <table><thead><tr><th>Дата</th><th>Врач</th><th>Диагноз</th><th>Лечение</th><th>Рекомендации</th></tr></thead>
            <tbody>{medicalRecords.map(record => <tr key={record.id}><td>{new Date(record.visit_date).toLocaleDateString()}</td><td>{record.doctor_name}</td><td>{record.diagnosis || '—'}</td><td>{record.treatment || '—'}</td><td>{record.recommendations || '—'}</td></tr>)}</tbody></table>
            
            <h2>Документы</h2>
            <label className="upload-btn">+ Загрузить файл<input type="file" onChange={handleFileUpload} hidden /></label>
            <ul>{files.map(file => <li key={file.id}>📄 {file.file_name} <a href={`${API_URL}/api/files/download/${file.id}`} download>Скачать</a></li>)}</ul>
        </div>
    );
};

export default PetCard;