const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Проверка переменных окружения
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

console.log('🔧 Проверка Supabase переменных:');
console.log('SUPABASE_URL:', supabaseUrl ? '✅ установлен' : '❌ ОТСУТСТВУЕТ');
console.log('SUPABASE_SERVICE_KEY:', supabaseKey ? '✅ установлен' : '❌ ОТСУТСТВУЕТ');

// Инициализация Supabase клиента БЕЗ realtime
const supabase = supabaseUrl && supabaseKey 
    ? createClient(supabaseUrl, supabaseKey, {
        // Отключаем realtime (WebSocket не нужен для Storage)
        realtime: { enabled: false },
        auth: { persistSession: false }
      })
    : null;

if (supabase) {
    console.log('✅ Supabase клиент успешно инициализирован (realtime отключён)');
} else {
    console.error('❌ Supabase клиент НЕ инициализирован');
}

// Загрузка файла
router.post('/upload/:petId', authenticate, upload.single('file'), async (req, res) => {
    if (!supabase) {
        return res.status(500).json({ error: 'Хранилище не настроено. Обратитесь к администратору.' });
    }
    
    try {
        const { petId } = req.params;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }
        
        // Генерируем уникальное имя файла
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${petId}/${fileName}`;
        
        console.log('📤 Загрузка файла в Supabase Storage:', filePath);
        
        // Загружаем в Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('vet-files')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false
            });
        
        if (uploadError) {
            console.error('❌ Ошибка загрузки в Supabase:', uploadError);
            return res.status(500).json({ error: 'Ошибка загрузки файла: ' + uploadError.message });
        }
        
        // Сохраняем информацию в PostgreSQL
        const result = await pool.query(
            `INSERT INTO files (pet_id, file_name, file_path, file_type, file_size, uploaded_by) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, file_name, file_path`,
            [petId, file.originalname, filePath, file.mimetype, file.size, req.user.id]
        );
        
        console.log('✅ Файл загружен, ID:', result.rows[0].id);
        
        res.status(201).json({
            message: 'Файл успешно загружен',
            file: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Скачивание файла
router.get('/download/:id', authenticate, async (req, res) => {
    if (!supabase) {
        return res.status(500).json({ error: 'Хранилище не настроено. Обратитесь к администратору.' });
    }
    
    try {
        const { id } = req.params;
        
        // Находим файл в PostgreSQL
        const result = await pool.query(
            'SELECT file_path, file_name FROM files WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Файл не найден в базе данных' });
        }
        
        const { file_path, file_name } = result.rows[0];
        
        console.log('📥 Скачивание файла:', file_path);
        
        // Скачиваем файл из Supabase Storage
        const { data, error } = await supabase.storage
            .from('vet-files')
            .download(file_path);
        
        if (error) {
            console.error('❌ Ошибка скачивания из Supabase:', error);
            return res.status(500).json({ error: 'Ошибка доступа к файлу: ' + error.message });
        }
        
        if (!data) {
            return res.status(404).json({ error: 'Файл не найден в хранилище' });
        }
        
        // Отправляем файл
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file_name)}"`);
        res.setHeader('Content-Type', data.type || 'application/octet-stream');
        res.send(Buffer.from(await data.arrayBuffer()));
        
        console.log('✅ Файл отправлен клиенту, размер:', data.size);
        
    } catch (error) {
        console.error('❌ Ошибка скачивания:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получить список файлов питомца
router.get('/pet/:petId', authenticate, async (req, res) => {
    try {
        const { petId } = req.params;
        
        const result = await pool.query(
            `SELECT f.*, u.full_name as uploaded_by_name
             FROM files f
             LEFT JOIN users u ON f.uploaded_by = u.id
             WHERE f.pet_id = $1
             ORDER BY f.uploaded_at DESC`,
            [petId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения списка файлов:', error);
        res.status(500).json({ error: 'Ошибка получения списка файлов' });
    }
});

module.exports = router;