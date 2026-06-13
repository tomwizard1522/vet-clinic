// Маршруты для работы с врачами

const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Получение всех врачей
// Доступ: для всех авторизованных пользователей
router.get('/', authenticate, async (req, res) => {
    try {
        // Объединение doctors с users, чтобы получить ФИО, email и телефон
        const result = await pool.query(
            `SELECT d.*, u.full_name, u.email, u.phone 
             FROM doctors d 
             JOIN users u ON d.user_id = u.id 
             WHERE d.is_active = true 
             ORDER BY u.full_name`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения списка врачей.' });
    }
});

// Получение врача по ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT d.*, u.full_name, u.email, u.phone 
             FROM doctors d 
             JOIN users u ON d.user_id = u.id 
             WHERE d.id = $1`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Врач не найден.' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения данных врача.' });
    }
});

// Обновление данных врача
// Доступ: админ или сам врач
router.put('/:id', authenticate, async (req, res) => {
    const { specialization, experience_years, bio, schedule, is_active } = req.body;
    
    try {
        // Если не админ, проверка, что врач обновляет свои данные
        if (req.user.role !== 'admin') {
            const doctorCheck = await pool.query(
                'SELECT user_id FROM doctors WHERE id = $1',
                [req.params.id]
            );
            if (doctorCheck.rows[0]?.user_id !== req.user.id) {
                return res.status(403).json({ error: 'Нет прав на редактирование.' });
            }
        }
        
        const result = await pool.query(
            `UPDATE doctors 
             SET specialization = COALESCE($1, specialization),
                 experience_years = COALESCE($2, experience_years),
                 bio = COALESCE($3, bio),
                 schedule = COALESCE($4, schedule),
                 is_active = COALESCE($5, is_active)
             WHERE id = $6 
             RETURNING *`,
            [specialization, experience_years, bio, schedule, is_active, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Врач не найден.' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка обновления данных врача.' });
    }
});

module.exports = router;