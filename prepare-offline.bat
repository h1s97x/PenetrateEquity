@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==========================================
echo 股权穿透图 - 离线部署准备脚本
echo ==========================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=1" %%i in ('npm -v') do set NPM_VERSION=%%i

echo [成功] Node.js: %NODE_VERSION%
echo [成功] npm: %NPM_VERSION%
echo.

REM 创建输出目录
set OUTPUT_DIR=offline-package
if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%"

echo ==========================================
echo 步骤 1: 安装依赖
echo ==========================================
echo.

call npm install
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)

echo.
echo [成功] 依赖安装完成
echo.

echo ==========================================
echo 步骤 2: 构建生产版本
echo ==========================================
echo.

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
echo [成功] 构建完成
echo.

echo ==========================================
echo 步骤 3: 打包文件
echo ==========================================
echo.

REM 检查是否安装了 7-Zip
set SEVENZIP="C:\Program Files\7-Zip\7z.exe"
if not exist %SEVENZIP% (
    set SEVENZIP="C:\Program Files (x86)\7-Zip\7z.exe"
)

if not exist %SEVENZIP% (
    echo [警告] 未找到 7-Zip，请手动压缩以下文件夹：
    echo   - dist 文件夹 ^=^> equity-chart-dist.zip
    echo   - 整个项目 ^=^> equity-chart-full.zip
    echo.
    echo 下载 7-Zip: https://www.7-zip.org/
    echo.
    goto :create_docs
)

echo 使用 7-Zip 打包...
echo.

REM 打包构建产物
echo 打包构建产物...
%SEVENZIP% a -tzip "%OUTPUT_DIR%\equity-chart-dist.zip" ".\dist\*" -mx9 >nul
echo [成功] 构建产物已打包: equity-chart-dist.zip

REM 打包完整项目
echo 打包完整项目...
%SEVENZIP% a -tzip "%OUTPUT_DIR%\equity-chart-full.zip" ^
  ".\*" ^
  -x!.git ^
  -x!.github ^
  -x!.kiro ^
  -x!offline-package ^
  -x!*.zip ^
  -mx9 >nul
echo [成功] 完整项目已打包: equity-chart-full.zip

:create_docs
echo.
echo ==========================================
echo 步骤 4: 创建部署文档
echo ==========================================
echo.

REM 复制部署文档
copy "docs\OFFLINE-DEPLOYMENT.md" "%OUTPUT_DIR%\" >nul
copy "docs\DEPLOYMENT-CHECKLIST.md" "%OUTPUT_DIR%\" >nul

REM 创建快速开始文档
(
echo 股权穿透图可视化系统 - 离线部署包
echo =====================================
echo.
echo 本包包含以下文件：
echo 1. equity-chart-dist.zip    - 构建产物（推荐使用）
echo 2. equity-chart-full.zip    - 完整项目（包含源码和依赖）
echo 3. OFFLINE-DEPLOYMENT.md    - 详细部署文档
echo 4. DEPLOYMENT-CHECKLIST.md  - 部署检查清单
echo.
echo 快速部署步骤：
echo =============
echo.
echo 方案 A：静态文件部署（推荐，无需 Node.js）
echo -----------------------------------------
echo.
echo 1. 解压 equity-chart-dist.zip
echo.
echo 2. 部署到 IIS
echo    - 将 dist 文件夹内容复制到 C:\inetpub\wwwroot\equity-chart\
echo    - 在该目录创建 web.config 文件（参考文档）
echo    - 在 IIS 管理器中创建网站
echo.
echo 3. 访问系统
echo    http://服务器IP
echo.
echo.
echo 方案 B：使用 Node.js 运行（需要 Node.js）
echo ----------------------------------------
echo.
echo 1. 解压 equity-chart-full.zip
echo.
echo 2. 进入项目目录
echo    cd equity-chart
echo.
echo 3. 运行预览服务器
echo    npm run preview -- --host 0.0.0.0 --port 80
echo.
echo 4. 访问系统
echo    http://服务器IP
echo.
echo.
echo 详细说明请查看 OFFLINE-DEPLOYMENT.md
echo.
echo 技术支持：
echo - 浏览器控制台（F12）查看错误
echo - 检查 Web 服务器日志
echo - 参考部署文档
) > "%OUTPUT_DIR%\README.txt"

echo [成功] 部署文档已创建
echo.

echo ==========================================
echo 步骤 5: 生成文件清单
echo ==========================================
echo.

REM 生成文件清单
(
echo 离线部署包文件清单
echo ==================
echo.
echo 生成时间: %date% %time%
echo Node.js 版本: %NODE_VERSION%
echo npm 版本: %NPM_VERSION%
echo.
echo 文件列表:
echo ---------
dir "%OUTPUT_DIR%" /b
) > "%OUTPUT_DIR%\FILE-LIST.txt"

echo [成功] 文件清单已生成
echo.

echo ==========================================
echo 准备完成！
echo ==========================================
echo.
echo 输出目录: %OUTPUT_DIR%
echo.
echo 包含文件:
echo   1. equity-chart-dist.zip    - 构建产物
echo   2. equity-chart-full.zip    - 完整项目
echo   3. OFFLINE-DEPLOYMENT.md    - 部署文档
echo   4. DEPLOYMENT-CHECKLIST.md  - 检查清单
echo   5. README.txt               - 快速开始
echo   6. FILE-LIST.txt            - 文件清单
echo.
echo 下一步操作:
echo 1. 将 %OUTPUT_DIR% 目录复制到 U 盘或移动硬盘
echo 2. 在内网服务器上解压文件
echo 3. 按照 OFFLINE-DEPLOYMENT.md 文档部署
echo.
echo 推荐使用方案 A（静态文件 + IIS）
echo.

pause
