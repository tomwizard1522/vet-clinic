// Главный файл сервера
// Запуск Express-сервера, подключение маршрутов и настройка промежуточных обработчиков

const express = require('express'); // Фреймворк для создания сервера
const cors = require('cors'); // Разрешает запросы с других доменов
const path = require('path');
require('dotenv').config();

// Импорт API эндпоинтов
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const petRoutes = require('./routes/pets');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const medicalRecordRoutes = require('./routes/medicalRecords');
const fileRoutes = require('./routes/files');

const app = express(); // Экземпляр приложения Express

// Настройка Middleware
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json()); // Автоматический парсинг JSON из тела запроса

// Раздача файлов из папки uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Подключение API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/doctors', doctorRoutes); // Получение и обновление врачей
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/files', fileRoutes); // Загрузка и скачивание файлов

// Глобальный обработчик ошибок
// Если в любом месте происходит ошибка, она попадёт сюда
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Внутренняя ошибка сервера.' });
});

app.get('/api/debug-users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, role FROM users LIMIT 5');
        res.json({ success: true, users: result.rows });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});