#!/bin/bash

# =============================================================================
# AI Recruitment App - EC2 Setup Script
# =============================================================================
# This script sets up everything needed to run the AI Recruitment App on EC2
# Run with: bash ec2-setup.sh
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# =============================================================================
# CONFIGURATION
# =============================================================================

APP_DIR="$HOME/ai-recruitment-app"
REPO_URL=""  # Will be set if using git
OPENAI_API_KEY=""  # Will be prompted

# =============================================================================
# FUNCTIONS
# =============================================================================

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root. Run as ubuntu user."
        exit 1
    fi
}

# Update system packages
update_system() {
    log "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    log "System updated successfully"
}

# Install Node.js 18
install_nodejs() {
    log "Installing Node.js 18..."
    
    # Check if Node.js is already installed
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        info "Node.js is already installed: $NODE_VERSION"
        
        # Check if it's version 18 or higher
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            info "Node.js version is sufficient, skipping installation"
            return
        else
            warn "Node.js version is too old, updating..."
        fi
    fi
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    log "Node.js installed successfully: $NODE_VERSION"
    log "NPM version: $NPM_VERSION"
}

# Install PM2 process manager
install_pm2() {
    log "Installing PM2 process manager..."
    
    if command -v pm2 &> /dev/null; then
        info "PM2 is already installed"
        return
    fi
    
    sudo npm install -g pm2
    log "PM2 installed successfully"
}

# Install Python3 (for static file server)
install_python() {
    log "Installing Python3..."
    
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        info "Python3 is already installed: $PYTHON_VERSION"
        return
    fi
    
    sudo apt install -y python3
    log "Python3 installed successfully"
}

# Install Nginx (optional)
install_nginx() {
    log "Installing Nginx..."
    
    if command -v nginx &> /dev/null; then
        info "Nginx is already installed"
        return
    fi
    
    sudo apt install -y nginx
    
    # Start and enable Nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    log "Nginx installed and started successfully"
}

# Install additional utilities
install_utilities() {
    log "Installing additional utilities..."
    sudo apt install -y curl wget unzip git htop nano
    log "Utilities installed successfully"
}

# Prompt for OpenAI API key
get_api_key() {
    echo
    info "Please enter your OpenAI API key:"
    echo -e "${YELLOW}You can find this at: https://platform.openai.com/api-keys${NC}"
    read -p "OpenAI API Key: " OPENAI_API_KEY
    
    if [[ -z "$OPENAI_API_KEY" ]]; then
        error "OpenAI API key is required!"
        exit 1
    fi
    
    log "API key configured"
}

# Setup application directory
setup_app_directory() {
    log "Setting up application directory..."
    
    # Remove existing directory if it exists
    if [[ -d "$APP_DIR" ]]; then
        warn "Removing existing application directory..."
        rm -rf "$APP_DIR"
    fi
    
    mkdir -p "$APP_DIR"
    log "Application directory created: $APP_DIR"
}

# Create application files (since we can't git clone)
create_app_files() {
    log "Creating application structure..."
    
    # Create directory structure
    mkdir -p "$APP_DIR/server"
    mkdir -p "$APP_DIR/scripts"
    mkdir -p "$APP_DIR/styles"
    
    # Create package.json for server
    cat > "$APP_DIR/server/package.json" << 'EOF'
{
  "name": "ai-recruitment-proxy",
  "version": "1.0.0",
  "description": "AI Recruitment App Proxy Server",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "morgan": "^1.10.0",
    "node-fetch": "^3.3.2",
    "dotenv": "^16.3.1"
  }
}
EOF

    # Create .env file
    cat > "$APP_DIR/server/.env" << EOF
# OpenAI API Configuration
OPENAI_API_KEY=$OPENAI_API_KEY

# Server Configuration  
PORT=8787
ALLOWED_ORIGIN=*

# Default Model
DEFAULT_MODEL=gpt-4o-mini
EOF

    # Create placeholder files
    touch "$APP_DIR/index.html"
    touch "$APP_DIR/scripts/app.js"
    touch "$APP_DIR/styles/style.css"
    touch "$APP_DIR/server/server.js"
    
    log "Application structure created"
    info "You'll need to upload your application files to: $APP_DIR"
}

# Install server dependencies
install_dependencies() {
    log "Installing server dependencies..."
    cd "$APP_DIR/server"
    npm install
    log "Dependencies installed successfully"
}

# Create systemd services (alternative to PM2)
create_systemd_services() {
    log "Creating systemd services..."
    
    # API Server service
    sudo tee /etc/systemd/system/ai-recruitment-api.service > /dev/null << EOF
[Unit]
Description=AI Recruitment API Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$APP_DIR/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Static file server service
    sudo tee /etc/systemd/system/ai-recruitment-static.service > /dev/null << EOF
[Unit]
Description=AI Recruitment Static File Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/python3 -m http.server 8000
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd
    sudo systemctl daemon-reload
    
    log "Systemd services created"
}

# Configure Nginx
configure_nginx() {
    log "Configuring Nginx..."
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/ai-recruitment > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Static files
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:8787;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
    }

    # Handle preflight requests
    location ~ ^/api/.*$ {
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
EOF

    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/ai-recruitment /etc/nginx/sites-enabled/
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    if sudo nginx -t; then
        sudo systemctl restart nginx
        log "Nginx configured successfully"
    else
        error "Nginx configuration test failed"
        exit 1
    fi
}

# Setup firewall
setup_firewall() {
    log "Setting up UFW firewall..."
    
    # Install UFW if not present
    sudo apt install -y ufw
    
    # Reset UFW to defaults
    sudo ufw --force reset
    
    # Set default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow our application ports (for direct access if needed)
    sudo ufw allow 8000/tcp comment 'Static files'
    sudo ufw allow 8787/tcp comment 'API server'
    
    # Enable UFW
    sudo ufw --force enable
    
    log "Firewall configured successfully"
}

# Create management scripts
create_management_scripts() {
    log "Creating management scripts..."
    
    # Create start script
    cat > "$APP_DIR/start.sh" << 'EOF'
#!/bin/bash
echo "Starting AI Recruitment App..."
sudo systemctl start ai-recruitment-api
sudo systemctl start ai-recruitment-static
sudo systemctl start nginx
echo "All services started!"
EOF

    # Create stop script
    cat > "$APP_DIR/stop.sh" << 'EOF'
#!/bin/bash
echo "Stopping AI Recruitment App..."
sudo systemctl stop ai-recruitment-api
sudo systemctl stop ai-recruitment-static
echo "Services stopped!"
EOF

    # Create status script
    cat > "$APP_DIR/status.sh" << 'EOF'
#!/bin/bash
echo "=== AI Recruitment App Status ==="
echo
echo "API Server:"
sudo systemctl status ai-recruitment-api --no-pager -l
echo
echo "Static Server:"
sudo systemctl status ai-recruitment-static --no-pager -l
echo
echo "Nginx:"
sudo systemctl status nginx --no-pager -l
echo
echo "=== Port Status ==="
sudo netstat -tlnp | grep -E ':(80|8000|8787) '
EOF

    # Create logs script
    cat > "$APP_DIR/logs.sh" << 'EOF'
#!/bin/bash
echo "=== AI Recruitment App Logs ==="
echo
echo "Choose service to view logs:"
echo "1) API Server"
echo "2) Static Server" 
echo "3) Nginx Error Log"
echo "4) Nginx Access Log"
read -p "Enter choice (1-4): " choice

case $choice in
    1) sudo journalctl -u ai-recruitment-api -f ;;
    2) sudo journalctl -u ai-recruitment-static -f ;;
    3) sudo tail -f /var/log/nginx/error.log ;;
    4) sudo tail -f /var/log/nginx/access.log ;;
    *) echo "Invalid choice" ;;
esac
EOF

    # Make scripts executable
    chmod +x "$APP_DIR"/*.sh
    
    log "Management scripts created in $APP_DIR"
}

# Display final instructions
show_final_instructions() {
    echo
    echo "============================================================================="
    log "🎉 AI Recruitment App setup completed successfully!"
    echo "============================================================================="
    echo
    info "📁 Application directory: $APP_DIR"
    info "🔧 Configuration file: $APP_DIR/server/.env"
    echo
    info "📋 Next steps:"
    echo "1. Upload your application files to: $APP_DIR"
    echo "   - Copy index.html to $APP_DIR/"
    echo "   - Copy scripts/app.js to $APP_DIR/scripts/"
    echo "   - Copy styles/style.css to $APP_DIR/styles/"
    echo "   - Copy server/server.js to $APP_DIR/server/"
    echo
    echo "2. Start the services:"
    echo "   cd $APP_DIR && ./start.sh"
    echo
    echo "3. Check status:"
    echo "   cd $APP_DIR && ./status.sh"
    echo
    echo "4. View logs:"
    echo "   cd $APP_DIR && ./logs.sh"
    echo
    info "🌐 Access your app:"
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "YOUR_EC2_PUBLIC_IP")
    echo "   - Main app: http://$PUBLIC_IP"
    echo "   - Direct static: http://$PUBLIC_IP:8000"
    echo "   - Direct API: http://$PUBLIC_IP:8787"
    echo
    info "🔒 Security notes:"
    echo "   - Firewall is configured with UFW"
    echo "   - API key is stored securely in .env file"
    echo "   - Services run as non-root user"
    echo
    warn "⚠️  Remember to:"
    echo "   - Upload your application files"
    echo "   - Configure your domain DNS (if using a domain)"
    echo "   - Set up SSL certificate for production (use certbot)"
    echo
    echo "============================================================================="
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    echo "============================================================================="
    echo "🚀 AI Recruitment App - EC2 Setup Script"
    echo "============================================================================="
    echo
    
    # Pre-flight checks
    check_root
    
    # Get API key first
    get_api_key
    
    echo
    log "Starting setup process..."
    
    # System setup
    update_system
    install_utilities
    install_nodejs
    install_pm2
    install_python
    install_nginx
    
    # Application setup
    setup_app_directory
    create_app_files
    install_dependencies
    
    # Service configuration
    create_systemd_services
    configure_nginx
    setup_firewall
    
    # Management tools
    create_management_scripts
    
    # Final instructions
    show_final_instructions
}

# Run main function
main "$@"
