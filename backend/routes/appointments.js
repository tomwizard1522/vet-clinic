const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Получить записи (фильтр по роли)
router.get('/', authenticate, async (req, res) => {
    try {
        let query, params;
        
        if (req.user.role === 'admin') {
            query = `
                SELECT a.*, p.name as pet_name, u.full_name as owner_name, 
                       d.user_id as doctor_user_id, doc.full_name as doctor_name
                FROM appointments a
                JOIN pets p ON a.pet_id = p.id
                JOIN users u ON p.owner_id = u.id
                JOIN doctors d ON a.doctor_id = d.id
                JOIN users doc ON d.user_id = doc.id
                ORDER BY a.appointment_time DESC
            `;
            params = [];
        } else if (req.user.role === 'doctor') {
            // Получаем doctor_id по user_id
            const doctorResult = await pool.query(
                'SELECT id FROM doctors WHERE user_id = $1',
                [req.user.id]
            );
            const doctorId = doctorResult.rows[0]?.id;
            
            if (!doctorId) {
                return res.status(404).json({ error: 'Профиль врача не найден.' });
            }
            
            query = `
                SELECT a.*, 
                       p.id as pet_id, 
                       p.name as pet_name, 
                       u.id as owner_id,
                       u.full_name as owner_name
                FROM appointments a
                JOIN pets p ON a.pet_id = p.id
                JOIN users u ON p.owner_id = u.id
                WHERE a.doctor_id = $1
                ORDER BY a.appointment_time ASC
            `;
            params = [doctorId];
        } else {
            query = `
                SELECT a.*, 
                       p.name as pet_name, 
                       doc.full_name as doctor_name,
                       p.id as pet_id
                FROM appointments a
                JOIN pets p ON a.pet_id = p.id
                JOIN doctors d ON a.doctor_id = d.id
                JOIN users doc ON d.user_id = doc.id
                WHERE p.owner_id = $1
                ORDER BY a.appointment_time DESC
            `;
            params = [req.user.id];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения списка записей.' });
    }
});

// Создать запись (владелец или админ)
router.post('/', authenticate, authorize('owner', 'admin'), [
    body('pet_id').notEmpty().withMessage('ID питомца обязателен'),
    body('doctor_id').notEmpty().withMessage('ID врача обязателен'),
    body('appointment_time').notEmpty().withMessage('Время приёма обязательно'),
    body('reason').optional()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { pet_id, doctor_id, appointment_time, reason } = req.body;
    
    try {
        // Проверка, что питомец принадлежит текущему пользователю (если не админ)
        if (req.user.role !== 'admin') {
            const petCheck = await pool.query(
                'SELECT owner_id FROM pets WHERE id = $1',
                [pet_id]
            );
            if (petCheck.rows[0]?.owner_id !== req.user.id) {
                return res.status(403).json({ error: 'У вас нет прав на запись этого питомца.' });
            }
        }
        
        const result = await pool.query(
            `INSERT INTO appointments (pet_id, doctor_id, appointment_time, reason, status) 
             VALUES ($1, $2, $3, $4, 'scheduled') 
             RETURNING *`,
            [pet_id, doctor_id, appointment_time, reason]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка создания записи.' });
    }
});

// Обновить статус записи (врач или админ)
router.patch('/:id/status', authenticate, authorize('doctor', 'admin'), [
    body('status').isIn(['scheduled', 'completed', 'cancelled', 'no_show']).withMessage('Неверный статус')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { status } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE appointments 
             SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 
             RETURNING *`,
            [status, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запись не найдена.' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка обновления статуса записи.' });
    }
});

// Отменить запись (владелец, врач или админ)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        // Проверка прав на отмену
        let hasAccess = false;
        
        if (req.user.role === 'admin') {
            hasAccess = true;
        } else if (req.user.role === 'doctor') {
            const doctorResult = await pool.query(
                'SELECT id FROM doctors WHERE user_id = $1',
                [req.user.id]
            );
            const checkResult = await pool.query(
                'SELECT id FROM appointments WHERE id = $1 AND doctor_id = $2',
                [req.params.id, doctorResult.rows[0]?.id]
            );
            hasAccess = checkResult.rows.length > 0;
        } else {
            const checkResult = await pool.query(
                `SELECT a.id FROM appointments a
                 JOIN pets p ON a.pet_id = p.id
                 WHERE a.id = $1 AND p.owner_id = $2`,
                [req.params.id, req.user.id]
            );
            hasAccess = checkResult.rows.length > 0;
        }
        
        if (!hasAccess) {
            return res.status(403).json({ error: 'Нет прав на отмену этой записи.' });
        }
        
        await pool.query('DELETE FROM appointments WHERE id = $1', [req.params.id]);
        res.json({ message: 'Запись успешно отменена.' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка отмены записи.' });
    }
});

module.exports = router;