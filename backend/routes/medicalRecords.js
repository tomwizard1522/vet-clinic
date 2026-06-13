// Маршруты для работы с медицинскими картами

const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Получение всех мед. записей питомца
// Доступ: владелец питомца, врач или админ
router.get('/pet/:petId', authenticate, async (req, res) => {
    try {
        const { petId } = req.params;
        const petCheck = await pool.query('SELECT owner_id FROM pets WHERE id = $1', [petId]);
        if (petCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Питомец не найден.' });
        }
        
        if (req.user.role !== 'admin' && req.user.role !== 'doctor' && petCheck.rows[0].owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Нет доступа к медицинским записям.' });
        }
        
        // Получаем все записи с именем врача
        const result = await pool.query(
            `SELECT mr.*, u.full_name as doctor_name
             FROM medical_records mr
             JOIN doctors d ON mr.doctor_id = d.id
             JOIN users u ON d.user_id = u.id
             WHERE mr.pet_id = $1
             ORDER BY mr.visit_date DESC`,
            [petId]
        );
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения медицинских записей.' });
    }
});

// Создание мед.записи (заполнение карты)
// Доступ: только врач 
// Вызывается, когда врач завершает приём и вносит диагноз/лечение
router.post('/', authenticate, authorize('doctor'), async (req, res) => {
    const { pet_id, appointment_id, visit_date, diagnosis, treatment, recommendations } = req.body;
    
    try {
        // Получение doctor_id по user_id из токена
        const doctorResult = await pool.query(
            'SELECT id FROM doctors WHERE user_id = $1',
            [req.user.id]
        );
        const doctor_id = doctorResult.rows[0]?.id;
        
        if (!doctor_id) {
            return res.status(404).json({ error: 'Профиль врача не найден.' });
        }
        
        const result = await pool.query(
            `INSERT INTO medical_records (pet_id, doctor_id, appointment_id, visit_date, diagnosis, treatment, recommendations) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [pet_id, doctor_id, appointment_id, visit_date, diagnosis, treatment, recommendations]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка создания медицинской записи.' });
    }
});

module.exports = router;