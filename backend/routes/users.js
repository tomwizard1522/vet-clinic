// Маршруты для управления пользователями
// Доступ: только админ (кроме GET /:id для самого себя)

const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Получение всех пользователей
// Доступ: только админ
router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        // Только публичные поля, без password_hash
        const result = await pool.query(
            'SELECT id, email, full_name, phone, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения списка пользователей.' });
    }
});

// Получение пользователя по ID
// Доступ: админ или сам пользователь
router.get('/:id', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = $1',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден.' });
        }
        
        if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
            return res.status(403).json({ error: 'Нет доступа к этому пользователю.' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения пользователя.' });
    }
});

// Обновление пользователя
// Доступ: админ или сам пользователь (админ может менять больше полей)
router.put('/:id', authenticate, async (req, res) => {
    const { full_name, phone } = req.body;
    
    try {
        if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
            return res.status(403).json({ error: 'Нет прав на редактирование.' });
        }
        
        const result = await pool.query(
            `UPDATE users 
             SET full_name = COALESCE($1, full_name), 
                 phone = COALESCE($2, phone), 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3 
             RETURNING id, email, full_name, phone, role`,
            [full_name, phone, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден.' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка обновления пользователя.' });
    }
});

// Удаление пользователя
// Доступ: только админ (каскадное удаление всех питомцев и записей)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({ message: 'Пользователь успешно удалён.' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка удаления пользователя.' });
    }
});

module.exports = router;