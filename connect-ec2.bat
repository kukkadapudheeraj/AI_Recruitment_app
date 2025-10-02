@echo off
REM AI Recruitment App - EC2 Connection Script for Windows
REM Usage: Double-click this file or run from Command Prompt

echo ================================================
echo  AI Recruitment App - EC2 Connection
echo ================================================
echo.

REM Configuration - UPDATE THESE VALUES
set EC2_IP=YOUR_EC2_PUBLIC_IP_HERE
set KEY_FILE=C:\path\to\your-key-file.pem
set USERNAME=ubuntu

REM Check if key file exists
if not exist "%KEY_FILE%" (
    echo ERROR: Key file not found: %KEY_FILE%
    echo Please update the KEY_FILE path in this script.
    echo.
    pause
    exit /b 1
)

REM Check if SSH is available
ssh -V >nul 2>&1
if errorlevel 1 (
    echo ERROR: SSH not found. Please install OpenSSH or use PuTTY.
    echo.
    echo To install OpenSSH on Windows 10/11:
    echo 1. Go to Settings ^> Apps ^> Optional Features
    echo 2. Click "Add a feature"
    echo 3. Search for "OpenSSH Client" and install it
    echo.
    pause
    exit /b 1
)

echo Connecting to EC2 instance...
echo IP: %EC2_IP%
echo User: %USERNAME%
echo Key: %KEY_FILE%
echo.

REM Connect to EC2
ssh -i "%KEY_FILE%" %USERNAME%@%EC2_IP%

echo.
echo Connection closed.
pause
