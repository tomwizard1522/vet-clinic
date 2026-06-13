// Маршруты для работы с питомцами

const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Получение списка питомцев
 
// Админ: все питомцы всех пользователей
// Владелец: только его питомцы
// Врач: маршрут через appointments

router.get('/', authenticate, async (req, res) => {
    try {
        let query, params;
        
        if (req.user.role === 'admin') {
            query = `
                SELECT p.*, u.full_name as owner_name 
                FROM pets p 
                JOIN users u ON p.owner_id = u.id 
                ORDER BY p.created_at DESC
            `;
            params = [];
        } 
        else {
            query = `SELECT * FROM pets WHERE owner_id = $1 ORDER BY created_at DESC`;
            params = [req.user.id];
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения списка питомцев.' });
    }
});

// Получение одного питомца по ID

router.get('/:id', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, u.full_name as owner_name 
             FROM pets p 
             JOIN users u ON p.owner_id = u.id 
             WHERE p.id = $1`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Питомец не найден.' });
        }
        
        const pet = result.rows[0];
        
        // Проверка прав доступа
        if (req.user.role !== 'admin' && req.user.role !== 'doctor' && pet.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Нет доступа к этому питомцу.' });
        }
        
        res.json(pet);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка получения данных питомца.' });
    }
});

// Добавление питомца

// Доступ: владелец или админ
// если админ — можно указать любого владельца, если владелец — используется его ID

router.post('/', authenticate, authorize('owner', 'admin'), [
    body('name').notEmpty().withMessage('Кличка обязательна'),
    body('species').notEmpty().withMessage('Вид обязателен')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, species, breed, birth_date, gender, weight, medical_notes, chronic_diseases, allergies } = req.body;

    const owner_id = req.user.role === 'admin' ? req.body.owner_id : req.user.id;
    
    try {
        const result = await pool.query(
            `INSERT INTO pets (owner_id, name, species, breed, birth_date, gender, weight, medical_notes, chronic_diseases, allergies) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
            [owner_id, name, species, breed, birth_date, gender, weight, medical_notes, chronic_diseases, allergies]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка добавления питомца.' });
    }
});

// Обновление питомца

// Доступ: владелец питомца или админ

router.put('/:id', authenticate, authorize('owner', 'admin'), async (req, res) => {
    const { name, species, breed, birth_date, gender, weight, medical_notes, chronic_diseases, allergies } = req.body;
    
    try {
        const petCheck = await pool.query('SELECT owner_id FROM pets WHERE id = $1', [req.params.id]);
        if (petCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Питомец не найден.' });
        }
        
        if (req.user.role !== 'admin' && petCheck.rows[0].owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Нет прав на редактирование.' });
        }
        
        const result = await pool.query(
            `UPDATE pets 
             SET name = $1, species = $2, breed = $3, birth_date = $4, 
                 gender = $5, weight = $6, medical_notes = $7, 
                 chronic_diseases = $8, allergies = $9, updated_at = CURRENT_TIMESTAMP
             WHERE id = $10 
             RETURNING *`,
            [name, species, breed, birth_date, gender, weight, medical_notes, chronic_diseases, allergies, req.params.id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка обновления питомца.' });
    }
});

// Удаление питомца
 
// Доступ: владелец питомца или админ

router.delete('/:id', authenticate, authorize('owner', 'admin'), async (req, res) => {
    try {
        const petCheck = await pool.query('SELECT owner_id FROM pets WHERE id = $1', [req.params.id]);
        if (petCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Питомец не найден.' });
        }
        
        if (req.user.role !== 'admin' && petCheck.rows[0].owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Нет прав на удаление.' });
        }
        
        await pool.query('DELETE FROM pets WHERE id = $1', [req.params.id]);
        res.json({ message: 'Питомец успешно удалён.' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка удаления питомца.' });
    }
});

module.exports = router;