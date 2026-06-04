const express = require('express');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Загрузить файл для питомца
router.post('/upload/:petId', authenticate, upload.single('file'), async (req, res) => {
    try {
        const { petId } = req.params;
        const { medical_record_id } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен.' });
        }
        
        // Проверка прав на питомца
        const petCheck = await pool.query(
            'SELECT owner_id FROM pets WHERE id = $1',
            [petId]
        );
        
        if (petCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Питомец не найден.' });
        }
        
        if (req.user.role !== 'admin' && req.user.role !== 'doctor' && petCheck.rows[0].owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Нет прав на загрузку файлов для этого питомца.' });
        }
        
        const result = await pool.query(
            `INSERT INTO files (pet_id, medical_record_id, file_name, file_path, file_type, file_size, uploaded_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING *`,
            [petId, medical_record_id || null, req.file.originalname, req.file.path, req.file.mimetype, req.file.size, req.user.id]
        );
        
        res.status(201).json({
            message: 'Файл успешно загружен.',
            file: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка загрузки файла.' });
    }
});

// Получить все файлы питомца
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
        res.status(500).json({ error: 'Ошибка получения списка файлов.' });
    }
});

// Скачать файл
router.get('/download/:id', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT file_path, file_name FROM files WHERE id = $1',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Файл не найден.' });
        }
        
        const { file_path, file_name } = result.rows[0];
        res.download(file_path, file_name);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка скачивания файла.' });
    }
});

// Удалить файл
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM files WHERE id = $1', [req.params.id]);
        res.json({ message: 'Файл успешно удалён.' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка удаления файла.' });
    }
});

module.exports = router;