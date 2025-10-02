# AI Recruitment App - EC2 Connection Script for Windows PowerShell
# Usage: Right-click and "Run with PowerShell" or run from PowerShell

param(
    [string]$EC2_IP = "YOUR_EC2_PUBLIC_IP_HERE",
    [string]$KeyFile = "C:\path\to\your-key-file.pem",
    [string]$Username = "ubuntu"
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " AI Recruitment App - EC2 Connection" -ForegroundColor Cyan  
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if SSH is available
function Test-SSH {
    try {
        $null = Get-Command ssh -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Function to set proper permissions on key file
function Set-KeyFilePermissions {
    param([string]$FilePath)
    
    try {
        # Remove inheritance and all permissions
        icacls $FilePath /inheritance:r | Out-Null
        
        # Grant current user read permission
        icacls $FilePath /grant:r "$env:USERNAME`:R" | Out-Null
        
        Write-Host "✅ Key file permissions set correctly" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "⚠️  Warning: Could not set key file permissions automatically" -ForegroundColor Yellow
        Write-Host "   Please set permissions manually:" -ForegroundColor Yellow
        Write-Host "   1. Right-click the .pem file → Properties → Security" -ForegroundColor Yellow
        Write-Host "   2. Remove all users except yourself" -ForegroundColor Yellow
        Write-Host "   3. Give yourself 'Read' permission only" -ForegroundColor Yellow
        return $false
    }
}

# Validate parameters
if ($EC2_IP -eq "YOUR_EC2_PUBLIC_IP_HERE") {
    Write-Host "❌ ERROR: Please update the EC2_IP parameter in this script" -ForegroundColor Red
    Write-Host "   Current value: $EC2_IP" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path $KeyFile)) {
    Write-Host "❌ ERROR: Key file not found: $KeyFile" -ForegroundColor Red
    Write-Host "   Please update the KeyFile parameter in this script" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check SSH availability
if (-not (Test-SSH)) {
    Write-Host "❌ ERROR: SSH not found on this system" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install OpenSSH on Windows 10/11:" -ForegroundColor Yellow
    Write-Host "1. Open Settings → Apps → Optional Features" -ForegroundColor Yellow
    Write-Host "2. Click 'Add a feature'" -ForegroundColor Yellow
    Write-Host "3. Search for 'OpenSSH Client' and install it" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Use PuTTY from https://www.putty.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Set key file permissions
Write-Host "🔐 Setting key file permissions..." -ForegroundColor Blue
Set-KeyFilePermissions -FilePath $KeyFile

# Display connection info
Write-Host ""
Write-Host "🚀 Connecting to EC2 instance..." -ForegroundColor Green
Write-Host "   IP Address: $EC2_IP" -ForegroundColor White
Write-Host "   Username: $Username" -ForegroundColor White  
Write-Host "   Key File: $KeyFile" -ForegroundColor White
Write-Host ""

# Connect to EC2
try {
    ssh -i $KeyFile "$Username@$EC2_IP"
}
catch {
    Write-Host "❌ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Connection closed." -ForegroundColor Yellow
Read-Host "Press Enter to exit"
