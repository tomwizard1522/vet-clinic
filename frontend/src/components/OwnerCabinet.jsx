import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const OwnerCabinet = () => {
    const [pets, setPets] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPet, setNewPet] = useState({
        name: '',
        species: '',
        breed: '',
        birth_date: '',
        gender: 'male',
        weight: ''
    });
    const { user } = useAuth();

    useEffect(() => {
        fetchData();
    }, []);

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
    }
    const fetchData = async () => {
        setLoading(true);
        try {
            const [petsRes, appointmentsRes] = await Promise.all([
                axios.get(`${API_URL}/api/pets`),
                axios.get(`${API_URL}/api/appointments`)
            ]);
            setPets(Array.isArray(petsRes.data) ? petsRes.data : []);
            setAppointments(Array.isArray(appointmentsRes.data) ? appointmentsRes.data : []);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            setPets([]);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPet = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/pets`, newPet);
            await fetchData(); // Перезагружаем список после добавления
            setShowAddForm(false);
            setNewPet({ name: '', species: '', breed: '', birth_date: '', gender: 'male', weight: '' });
        } catch (error) {
            console.error('Ошибка добавления питомца:', error);
            alert('Ошибка добавления питомца');
        }
    };

    const handleDeletePet = async (petId) => {
        if (window.confirm('Вы уверены, что хотите удалить питомца?')) {
            try {
                await axios.delete(`${API_URL}/api/pets/${petId}`);
                await fetchData(); // Перезагружаем список после удаления
            } catch (error) {
                console.error('Ошибка удаления питомца:', error);
                alert('Ошибка удаления питомца');
            }
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <div>
            <h1>Добро пожаловать, {user?.full_name}!</h1>
            
            <div className="pets-header">
                <h2>Мои питомцы</h2>
                <button onClick={() => setShowAddForm(!showAddForm)}>+ Добавить питомца</button>
            </div>
            
            {showAddForm && (
                <form onSubmit={handleAddPet} className="add-pet-form">
                    <input type="text" placeholder="Кличка *" value={newPet.name} onChange={(e) => setNewPet({...newPet, name: e.target.value})} required />
                    <input type="text" placeholder="Вид *" value={newPet.species} onChange={(e) => setNewPet({...newPet, species: e.target.value})} required />
                    <input type="text" placeholder="Порода" value={newPet.breed} onChange={(e) => setNewPet({...newPet, breed: e.target.value})} />
                    <input type="date" value={newPet.birth_date} onChange={(e) => setNewPet({...newPet, birth_date: e.target.value})} />
                    <select value={newPet.gender} onChange={(e) => setNewPet({...newPet, gender: e.target.value})}>
                        <option value="male">Мальчик</option>
                        <option value="female">Девочка</option>
                    </select>
                    <input type="number" placeholder="Вес (кг)" value={newPet.weight} onChange={(e) => setNewPet({...newPet, weight: e.target.value})} />
                    <button type="submit">Сохранить</button>
                    <button type="button" onClick={() => setShowAddForm(false)}>Отмена</button>
                </form>
            )}
            
            <div className="pets-grid">
                {pets.length === 0 ? (
                    <p>У вас пока нет питомцев. Нажмите "Добавить питомца".</p>
                ) : (
                    pets.filter(pet => pet && pet.id).map(pet => (
                        <div key={pet.id} className="pet-card">
                            <h3>{pet.name || 'Без имени'}</h3>
                            <p>Вид: {pet.species || '—'}</p>
                            <p>Порода: {pet.breed || '—'}</p>
                            <p>Вес: {pet.weight ? `${pet.weight} кг` : '—'}</p>
                            <div className="pet-actions">
                                <Link to={`/pet/${pet.id}`}>
                                    <button>Карта</button>
                                </Link>
                                <button onClick={() => handleDeletePet(pet.id)}>Удалить</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <h2>История записей</h2>
            <table className="appointments-table">
                <thead>
                    <tr><th>Дата и время</th><th>Питомец</th><th>Врач</th><th>Статус</th></tr>
                </thead>
                <tbody>
                    {appointments.length === 0 ? (
                        <tr><td colSpan="4">Нет записей</td></tr>
                    ) : (
                        appointments.map(apt => (
                            <tr key={apt.id}>
                                <td>{new Date(apt.appointment_time).toLocaleString()}</td>
                                <td>{apt.pet_name}</td>
                                <td>{apt.doctor_name}</td>
                                <td>{apt.status === 'scheduled' ? 'Запланирован' : apt.status === 'completed' ? 'Завершён' : 'Отменён'}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default OwnerCabinet;