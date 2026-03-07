@echo off
chcp 65001

echo ========================================
echo 🔧 正在建置 Docker 映像檔
echo ========================================
docker-compose build

if %errorlevel% neq 0 (
    echo ❌ 建置失敗，請檢查錯誤訊息。
    pause
    exit /b 1
)

echo ========================================
echo ✅ Docker 映像檔建置完成
echo ========================================
echo.
echo 📝 執行下列指令來啟動容器：
echo    docker-compose up -d
echo.
pause
