import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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

    const fetchData = async () => {
        try {
            const [petsRes, appointmentsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/pets'),
                axios.get('http://localhost:5000/api/appointments')
            ]);
            setPets(petsRes.data);
            setAppointments(appointmentsRes.data);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPet = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/pets', newPet);
            setPets([...pets, response.data]);
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
                await axios.delete(`http://localhost:5000/api/pets/${petId}`);
                setPets(pets.filter(p => p.id !== petId));
            } catch (error) {
                console.error('Ошибка удаления питомца:', error);
                alert('Ошибка удаления питомца');
            }
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка...</div>;

    return (
        <div>
            <h1 style={{ marginBottom: '20px' }}>Добро пожаловать, {user?.full_name}!</h1>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Мои питомцы</h2>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{ background: '#27ae60', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    + Добавить питомца
                </button>
            </div>
            
            {showAddForm && (
                <div style={{ background: '#ecf0f1', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
                    <h3>Новый питомец</h3>
                    <form onSubmit={handleAddPet} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <input
                            type="text"
                            placeholder="Кличка *"
                            value={newPet.name}
                            onChange={(e) => setNewPet({...newPet, name: e.target.value})}
                            required
                            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                        <input
                            type="text"
                            placeholder="Вид (собака, кот) *"
                            value={newPet.species}
                            onChange={(e) => setNewPet({...newPet, species: e.target.value})}
                            required
                            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                        <input
                            type="text"
                            placeholder="Порода"
                            value={newPet.breed}
                            onChange={(e) => setNewPet({...newPet, breed: e.target.value})}
                            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                        <input
                            type="date"
                            placeholder="Дата рождения"
                            value={newPet.birth_date}
                            onChange={(e) => setNewPet({...newPet, birth_date: e.target.value})}
                            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                        <select
                            value={newPet.gender}
                            onChange={(e) => setNewPet({...newPet, gender: e.target.value})}
                            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }}
                        >
                            <option value="male">Мальчик</option>
                            <option value="female">Девочка</option>
                        </select>
                        <input
                            type="number"
                            placeholder="Вес (кг)"
                            value={newPet.weight}
                            onChange={(e) => setNewPet({...newPet, weight: e.target.value})}
                            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }}
                        />
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: '8px 16px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Отмена</button>
                            <button type="submit" style={{ padding: '8px 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Сохранить</button>
                        </div>
                    </form>
                </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                {pets.map(pet => (
                    <div key={pet.id} style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '15px', background: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <h3 style={{ marginBottom: '10px' }}>{pet.name}</h3>
                                <p><strong>Вид:</strong> {pet.species}</p>
                                <p><strong>Порода:</strong> {pet.breed || '—'}</p>
                                <p><strong>Вес:</strong> {pet.weight ? `${pet.weight} кг` : '—'}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <Link to={`/pet/${pet.id}`}>
                                    <button style={{ background: '#3498db', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Карта</button>
                                </Link>
                                <button onClick={() => handleDeletePet(pet.id)} style={{ background: '#e74c3c', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Удалить</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {pets.length === 0 && !showAddForm && (
                <div style={{ textAlign: 'center', padding: '40px', background: '#ecf0f1', borderRadius: '10px' }}>
                    <p>У вас ещё нет питомцев. Нажмите "Добавить питомца", чтобы начать.</p>
                </div>
            )}
            
            <h2 style={{ marginBottom: '15px' }}>История записей</h2>
            <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#2c3e50', color: 'white' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Дата и время</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Питомец</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Врач</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ padding: '30px', textAlign: 'center' }}>Нет записей к врачу</td>
                            </tr>
                        ) : (
                            appointments.map(apt => (
                                <tr key={apt.id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={{ padding: '12px' }}>{new Date(apt.appointment_time).toLocaleString()}</td>
                                    <td style={{ padding: '12px' }}>{apt.pet_name}</td>
                                    <td style={{ padding: '12px' }}>{apt.doctor_name}</td>
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
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OwnerCabinet;