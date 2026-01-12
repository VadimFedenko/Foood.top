@echo off
chcp 65001 >nul
echo ========================================
echo Запуск приложения Best Food Ever
echo ========================================
echo.

REM Проверка наличия node_modules
if not exist "node_modules" (
    echo Установка зависимостей...
    call npm install
    echo.
)

REM Запуск dev сервера
echo Запуск dev сервера...
echo.
call npm run dev

pause















