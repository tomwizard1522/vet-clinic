// Настройка загрузки файлов с помощью Multer (middleware для обработки multipart/form-data)
// 1) Создаёт папку uploads/, если её нет
// 2) Генерирует уникальное имя для каждого файла
// 3) Проверяет тип файла (только картинки, Word-документы и PDF)
// 4) Ограничивает размер файла (5 МБ)

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/';

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        cb(null, true);
    } 
    else {
        cb(new Error('Разрешены только изображения, Word-документы и PDF-файлы'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

module.exports = upload;