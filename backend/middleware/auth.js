// Middleware для аутентификации и авторизации
// authenticate() - проверяет JWT-токен и добавляет данные пользователя в req.user
// authorize() - проверяет, имеет ли пользователь нужную роль

const jwt = require('jsonwebtoken'); // работа с JWT-токенами

// Проверка на авторизацию пользователя (валидность токена)
// 1) Достаёт токен из заголовка Authorization (формат: "Bearer <токен>")
// 2) Проверяет его подпись с помощью JWT_SECRET
// 3) Если ок — расшифрованные данные в req.user и вызов next()
// 4) Если нет — Unauthorized (401)
const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Доступ запрещён. Токен не предоставлен.' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Недействительный токен.' });
    }
};

// Проверка на наличие разрешенных ролей у пользователя 
// @param {...string} roles - список разрешённых ролей 
// Пример:
// authorize('admin') — только админ
// authorize('owner', 'admin') — владелец или админ

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Недостаточно прав для выполнения операции.' });
        }
        next();
    };
};

module.exports = { authenticate, authorize };