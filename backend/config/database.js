// Подключение к базе данных PostgreSQL
// Использует пул соединений для работы с БД
// Параметры берутся из файла .env

const { Pool } = require('pg'); // клиент PostgreSQL для Node.js
require('dotenv').config();

// Пул соединений (готовые подключения к БД)
const pool = new Pool({
    host: process.env.DB_HOST, // localhost или IP сервера БД
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
});

// Экспорт пула для использования в других файлах
module.exports = pool;