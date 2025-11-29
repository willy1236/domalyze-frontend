@echo off
chcp 65001
set CONTAINER_NAME=domalyze-nextjs-container
set IMAGE_NAME=domalyze-nextjs
set NETWORK_NAME=cfnet

echo ========================================
echo 🔧 正在建置 Docker 映像檔: %IMAGE_NAME%
echo ========================================
docker build -t %IMAGE_NAME% .

if %errorlevel% neq 0 (
    echo ❌ 建置失敗，請檢查錯誤訊息。
    pause
    exit /b 1
)

echo ========================================
echo 🧹 檢查舊容器是否存在: %CONTAINER_NAME%
echo ========================================
docker stop %CONTAINER_NAME% >nul 2>&1
docker rm %CONTAINER_NAME% >nul 2>&1

echo ========================================
echo 🚀 啟動 Docker 容器: %CONTAINER_NAME%
echo ========================================
docker run -d -p 3000:3000 --name %CONTAINER_NAME% --network %NETWORK_NAME% --restart unless-stopped %IMAGE_NAME%

if %errorlevel% neq 0 (
    echo ❌ 容器啟動失敗，請檢查錯誤訊息。
    pause
    exit /b 1
)

echo ========================================
echo ✅ 容器已啟動，你可以透過 http://localhost:3000 訪問你的網站
echo ========================================
pause
