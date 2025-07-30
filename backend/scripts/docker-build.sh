#!/bin/bash

# Docker build and deployment script for AI Finance Manager Backend
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Script usage
usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build       Build Docker image"
    echo "  run         Run with docker compose (development)"
    echo "  prod        Run in production mode"
    echo "  stop        Stop all containers"
    echo "  clean       Clean up containers and images"
    echo "  logs        Show container logs"
    echo "  shell       Open shell in backend container"
    echo ""
    exit 1
}

# Build Docker image
build_image() {
    print_status "Building AI Finance Manager Backend Docker image..."
    docker build -t finance-manager-backend:latest .
    print_success "Docker image built successfully!"
}

# Run in development mode
run_dev() {
    print_status "Starting AI Finance Manager Backend in development mode..."
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from example..."
        if [ -f .env.production.example ]; then
            cp .env.production.example .env
            print_warning "Please edit .env file with your configuration before running."
            return 1
        fi
    fi
    
    docker compose up --build -d
    print_success "Backend started successfully!"
    print_status "API will be available at: http://localhost:8001"
    print_status "Health check: http://localhost:8001/health"
    print_status "API docs: http://localhost:8001/docs"
}

# Run in production mode
run_prod() {
    print_status "Starting AI Finance Manager Backend in production mode..."
    
    # Check if production env file exists
    if [ ! -f .env.production ]; then
        print_error ".env.production file not found!"
        print_status "Copy .env.production.example to .env.production and configure it."
        return 1
    fi
    
    # Use production environment file
    docker compose --env-file .env.production up --build -d
    print_success "Backend started in production mode!"
}

# Stop containers
stop_containers() {
    print_status "Stopping all containers..."
    docker compose down
    print_success "Containers stopped!"
}

# Clean up
cleanup() {
    print_status "Cleaning up containers and images..."
    docker compose down --rmi all --volumes --remove-orphans
    print_success "Cleanup completed!"
}

# Show logs
show_logs() {
    print_status "Showing container logs..."
    docker compose logs -f backend
}

# Open shell in backend container
open_shell() {
    print_status "Opening shell in backend container..."
    docker compose exec backend /bin/bash
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Main script logic
main() {
    # Check if Docker is available
    check_docker
    
    case "${1:-}" in
        build)
            build_image
            ;;
        run)
            run_dev
            ;;
        prod)
            run_prod
            ;;
        stop)
            stop_containers
            ;;
        clean)
            cleanup
            ;;
        logs)
            show_logs
            ;;
        shell)
            open_shell
            ;;
        *)
            usage
            ;;
    esac
}

# Run main function
main "$@"