// Маршруты для аутентификации

const express = require('express');
const bcrypt = require('bcryptjs'); // хэширование паролей
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator'); // валидация данных
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Регистрация
// 1) Проверка корректности данных
// 2) Проверка на совпадение почты с существующими пользователями
// 3) Хэширование пароля
// 4) Сохранение пользователя в таблицу users
// 5) Если это доктор - создание записи в таблице doctors
// 6) Генерация JWT-токена
// 7) Возвращение токена и данных пользователя

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
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует.' });
        }
        console.log('📝 Регистрация:', { email, password: password ? 'получен' : 'НЕ ПОЛУЧЕН' });
        console.log('📝 Хеширую пароль...');
        const salt = await bcrypt.genSalt(10); // 10 раундов шифрования
        const password_hash = await bcrypt.hash(password, salt);
        console.log('✅ Хеш создан:', password_hash.substring(0, 20) + '...');
        // Создание пользователя
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, phone, role) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role`,
            [email, password_hash, full_name, phone, role]
        );
        
        if (role === 'doctor') {
            await pool.query(
                `INSERT INTO doctors (user_id, specialization, is_active) 
                 VALUES ($1, $2, $3)`,
                [result.rows[0].id, 'Терапевт', true]
            );
        }
        
        const token = jwt.sign(
            { id: result.rows[0].id, email: result.rows[0].email, role: result.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        res.status(201).json({ token, user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера при регистрации.' });
    }
});

// Вход
 
// 1) Поиск пользователя по email
// 2) Сравнение введённого пароля с хэшем из БД
// 3) Если ок — генерация токена
// 4) Возвращение токена и данных пользователя

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
        console.log('🔑 Логин:', { email, password: password ? 'получен' : 'НЕ ПОЛУЧЕН' });
        const user = result.rows[0];
        console.log('👤 Найден пользователь:', user.email);
        console.log('🔐 Сравниваю пароль...');
        // Сравнение пароля (bcrypt.compare сам достаёт соль из хэша)
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        console.log('✅ Результат сравнения:', isValidPassword);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль.' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        
        res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера при входе.' });
    }
});

// Получение инфо о текущем пользователе

// Используется после логина или при перезагрузке, чтобы восстановить данные по сохранённому токену

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