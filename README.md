# Ветеринарная клиника — веб-приложение

## Стек технологий
- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: JWT

## Установка и запуск

### Требования
- Node.js 18+
- PostgreSQL 14+

### 1. Настройка базы данных
```bash
psql -U postgres -f database/init.sql
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env  # заполнить параметры
npm run dev
```
### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
### 4. Открыть в браузере
```text
http://localhost:5173
```
