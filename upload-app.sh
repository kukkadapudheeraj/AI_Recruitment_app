#!/bin/bash

# =============================================================================
# AI Recruitment App - File Upload Script
# =============================================================================
# This script uploads your local application files to the EC2 instance
# Run from your local machine: bash upload-app.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
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

# These will be prompted or set
EC2_IP=""
KEY_FILE=""
LOCAL_APP_DIR="./ai-recruitment-app-regen"
REMOTE_APP_DIR="/home/ubuntu/ai-recruitment-app"

# =============================================================================
# FUNCTIONS
# =============================================================================

# Get EC2 connection details
get_connection_details() {
    echo "============================================================================="
    echo "🚀 AI Recruitment App - File Upload"
    echo "============================================================================="
    echo
    
    # Get EC2 IP
    read -p "Enter your EC2 public IP address: " EC2_IP
    if [[ -z "$EC2_IP" ]]; then
        error "EC2 IP address is required!"
        exit 1
    fi
    
    # Get SSH key file
    read -p "Enter path to your SSH key file (.pem): " KEY_FILE
    if [[ ! -f "$KEY_FILE" ]]; then
        error "SSH key file not found: $KEY_FILE"
        exit 1
    fi
    
    # Check if local app directory exists
    if [[ ! -d "$LOCAL_APP_DIR" ]]; then
        error "Local app directory not found: $LOCAL_APP_DIR"
        echo "Please run this script from the directory containing: $LOCAL_APP_DIR"
        exit 1
    fi
    
    log "Connection details configured"
}

# Test SSH connection
test_connection() {
    log "Testing SSH connection..."
    
    if ssh -i "$KEY_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@$EC2_IP "echo 'Connection successful'" > /dev/null 2>&1; then
        log "SSH connection successful"
    else
        error "Cannot connect to EC2 instance. Please check:"
        echo "  - EC2 IP address: $EC2_IP"
        echo "  - SSH key file: $KEY_FILE"
        echo "  - Security group allows SSH from your IP"
        echo "  - EC2 instance is running"
        exit 1
    fi
}

# Upload application files
upload_files() {
    log "Uploading application files..."
    
    # Upload main files
    info "Uploading index.html..."
    scp -i "$KEY_FILE" "$LOCAL_APP_DIR/index.html" ubuntu@$EC2_IP:$REMOTE_APP_DIR/
    
    info "Uploading scripts..."
    scp -i "$KEY_FILE" -r "$LOCAL_APP_DIR/scripts" ubuntu@$EC2_IP:$REMOTE_APP_DIR/
    
    info "Uploading styles..."
    scp -i "$KEY_FILE" -r "$LOCAL_APP_DIR/styles" ubuntu@$EC2_IP:$REMOTE_APP_DIR/
    
    info "Uploading server files..."
    scp -i "$KEY_FILE" "$LOCAL_APP_DIR/server/server.js" ubuntu@$EC2_IP:$REMOTE_APP_DIR/server/
    
    log "All files uploaded successfully"
}

# Start services on remote server
start_services() {
    log "Starting services on EC2..."
    
    ssh -i "$KEY_FILE" ubuntu@$EC2_IP << 'EOF'
        cd /home/ubuntu/ai-recruitment-app
        
        # Enable and start services
        sudo systemctl enable ai-recruitment-api
        sudo systemctl enable ai-recruitment-static
        
        # Start services
        ./start.sh
        
        # Wait a moment for services to start
        sleep 3
        
        # Check status
        echo "=== Service Status ==="
        ./status.sh
EOF
    
    log "Services started successfully"
}

# Show final access information
show_access_info() {
    echo
    echo "============================================================================="
    log "🎉 Upload and deployment completed successfully!"
    echo "============================================================================="
    echo
    info "🌐 Your AI Recruitment App is now live:"
    echo "   - Main application: http://$EC2_IP"
    echo "   - Direct static files: http://$EC2_IP:8000"
    echo "   - API server: http://$EC2_IP:8787"
    echo
    info "🔧 Management commands (run on EC2):"
    echo "   - Start services: cd $REMOTE_APP_DIR && ./start.sh"
    echo "   - Stop services: cd $REMOTE_APP_DIR && ./stop.sh"
    echo "   - Check status: cd $REMOTE_APP_DIR && ./status.sh"
    echo "   - View logs: cd $REMOTE_APP_DIR && ./logs.sh"
    echo
    info "📋 To update the app in the future:"
    echo "   1. Run this upload script again"
    echo "   2. SSH to EC2 and restart: cd $REMOTE_APP_DIR && ./start.sh"
    echo
    echo "============================================================================="
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    get_connection_details
    test_connection
    upload_files
    start_services
    show_access_info
}

# Run main function
main "$@"
