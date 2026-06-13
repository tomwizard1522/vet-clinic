const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Храним в памяти

// Инициализация Supabase клиента
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Загрузка файла в Supabase Storage
router.post('/upload/:petId', authenticate, upload.single('file'), async (req, res) => {
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
        
        // Загружаем в Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('vet-files')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600'
            });
        
        if (uploadError) {
            console.error('Ошибка загрузки в Supabase:', uploadError);
            return res.status(500).json({ error: 'Ошибка загрузки файла' });
        }
        
        // Получаем публичный URL (или использовать signed URL)
        const { data: urlData } = supabase.storage
            .from('vet-files')
            .getPublicUrl(filePath);
        
        // Сохраняем информацию в БД
        const result = await pool.query(
            `INSERT INTO files (pet_id, file_name, file_path, file_type, file_size, uploaded_by) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [petId, file.originalname, filePath, file.mimetype, file.size, req.user.id]
        );
        
        res.status(201).json({
            message: 'Файл успешно загружен',
            file: result.rows[0],
            url: urlData.publicUrl
        });
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        res.status(500).json({ error: error.message });
    }
});

// Скачивание файла из Supabase Storage
router.get('/download/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Находим файл в БД
        const result = await pool.query(
            'SELECT file_path, file_name FROM files WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Файл не найден' });
        }
        
        const { file_path, file_name } = result.rows[0];
        
        // Создаём подписанный URL (действует 60 секунд)
        const { data, error } = await supabase.storage
            .from('vet-files')
            .createSignedUrl(file_path, 60);
        
        if (error) {
            console.error('Ошибка создания подписанного URL:', error);
            return res.status(500).json({ error: 'Ошибка доступа к файлу' });
        }
        
        // Перенаправляем на подписанный URL
        res.redirect(data.signedUrl);
        
    } catch (error) {
        console.error('Ошибка скачивания:', error);
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: 'Ошибка получения списка файлов' });
    }
});

module.exports = router;