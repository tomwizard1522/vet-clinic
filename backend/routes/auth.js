const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Регистрация нового пользователя
router.post('/register', [
    body('email').isEmail().withMessage('Неверный формат email'),
    body('password').isLength({ min: 6 }).withMessage('Пароль должен содержать минимум 6 символов'),
    body('full_name').notEmpty().withMessage('Имя обязательно'),
    body('role').isIn(['owner', 'doctor', 'admin']).withMessage('Неверная роль')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password, full_name, phone, role } = req.body;
    
    try {
        // Проверка существующего пользователя
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует.' });
        }
        
        // Хеширование пароля
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        // Создание пользователя
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, phone, role) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role`,
            [email, password_hash, full_name, phone, role]
        );
        
        // Если роль врач, создаём запись в таблице doctors
        if (role === 'doctor') {
            await pool.query(
                `INSERT INTO doctors (user_id, specialization, is_active) 
                 VALUES ($1, $2, $3)`,
                [result.rows[0].id, 'Терапевт', true]
            );
        }
        
        // Генерация токена
        const token = jwt.sign(
            { id: result.rows[0].id, email: result.rows[0].email, role: result.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        res.status(201).json({
            token,
            user: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера при регистрации.' });
    }
});

// Вход в систему
router.post('/login', [
    body('email').isEmail().withMessage('Неверный формат email'),
    body('password').notEmpty().withMessage('Пароль обязателен')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;
    
    try {
        const result = await pool.query(
            'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль.' });
        }
        
        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль.' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера при входе.' });
    }
});

// Получение информации о текущем пользователе
router.get('/me', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден.' });
        }
        
        const user = result.rows[0];
        
        // Если врач, добавляем информацию о специализации
        if (user.role === 'doctor') {
            const doctorResult = await pool.query(
                'SELECT specialization, experience_years, is_active FROM doctors WHERE user_id = $1',
                [user.id]
            );
            user.doctor_info = doctorResult.rows[0] || null;
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера.' });
    }
});

module.exports = router;