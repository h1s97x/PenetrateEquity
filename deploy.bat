@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==========================================
echo 股权穿透图可视化系统 - 部署脚本
echo ==========================================
echo.

REM 检查 Node.js
echo 检查 Node.js 环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js ^>= 16.x
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node -v') do set NODE_VERSION=%%i
echo [成功] Node.js 版本: %NODE_VERSION%

REM 检查 npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 npm
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [成功] npm 版本: %NPM_VERSION%
echo.

REM 询问部署类型
echo 请选择部署类型:
echo 1) 生产构建（推荐）
echo 2) 开发服务器
set /p DEPLOY_TYPE="请输入选项 (1 或 2): "

if "%DEPLOY_TYPE%"=="1" (
    echo.
    echo ==========================================
    echo 开始生产构建...
    echo ==========================================
    echo.
    
    REM 安装依赖
    echo 安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    
    REM 构建
    echo.
    echo 构建项目...
    call npm run build
    if %errorlevel% neq 0 (
        echo [错误] 构建失败
        pause
        exit /b 1
    )
    
    if not exist "dist" (
        echo [错误] 构建失败，未找到 dist 目录
        pause
        exit /b 1
    )
    
    echo.
    echo [成功] 构建成功！
    echo.
    echo ==========================================
    echo 部署信息
    echo ==========================================
    echo 构建输出目录: %cd%\dist
    echo.
    echo 下一步操作:
    echo 1. 将 dist 目录复制到 Web 服务器
    echo 2. 配置 Web 服务器（参考 docs\INTRANET-DEPLOYMENT.md）
    echo 3. 重启 Web 服务器
    echo.
    echo 示例命令（IIS）:
    echo   xcopy /E /I /Y dist\* C:\inetpub\wwwroot\equity-chart\
    echo   iisreset
    echo.
    
) else if "%DEPLOY_TYPE%"=="2" (
    echo.
    echo ==========================================
    echo 启动开发服务器...
    echo ==========================================
    echo.
    
    REM 安装依赖
    echo 安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    
    REM 询问端口
    set /p PORT="请输入端口号 (默认 5173): "
    if "%PORT%"=="" set PORT=5173
    
    echo.
    echo [成功] 启动服务器...
    echo 访问地址: http://localhost:%PORT%
    echo 按 Ctrl+C 停止服务器
    echo.
    
    call npm run dev -- --host 0.0.0.0 --port %PORT%
    
) else (
    echo [错误] 无效的选项
    pause
    exit /b 1
)

pause
