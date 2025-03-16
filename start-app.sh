#!/bin/bash

# QuickBooks Voice-to-Invoice Application Startup Script
# This script helps launch all components of the application

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}    QuickBooks Voice-to-Invoice Startup Script      ${NC}"
echo -e "${BLUE}====================================================${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}Warning: .env file not found. Creating from template...${NC}"
  cp .env.template .env
  echo -e "${GREEN}Created .env file. Please edit it with your credentials.${NC}"
  echo -e "${YELLOW}Press any key to continue or Ctrl+C to exit and edit the .env file...${NC}"
  read -n 1
fi

# Function to check if Docker is available
check_docker() {
  if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    return 0
  else
    return 1
  fi
}

# Main menu
echo -e "\n${BLUE}Choose startup method:${NC}"
echo -e "1) ${GREEN}Docker${NC} (Recommended - starts all services)"
echo -e "2) ${YELLOW}Manual${NC} (Start MongoDB separately, then backend, access frontend directly)"
echo -e "3) ${BLUE}Test Server${NC} (Mock APIs for testing without real dependencies)"
echo -e "q) ${RED}Quit${NC}"

read -p "Enter your choice [1-3 or q]: " choice

case $choice in
  1)
    if check_docker; then
      echo -e "\n${GREEN}Starting with Docker...${NC}"
      docker-compose up
    else
      echo -e "\n${RED}Error: Docker or docker-compose not found.${NC}"
      echo -e "${YELLOW}Please install Docker Desktop or choose another option.${NC}"
      exit 1
    fi
    ;;
  2)
    echo -e "\n${YELLOW}Starting in manual mode...${NC}"
    echo -e "${BLUE}Step 1: Make sure MongoDB is running in another terminal window.${NC}"
    echo -e "Run: ${YELLOW}mongod --dbpath <your-data-directory>${NC}"
    echo -e "\n${BLUE}Step 2: Starting backend server...${NC}"
    
    cd backend
    if [ ! -d "node_modules" ]; then
      echo -e "${YELLOW}Installing backend dependencies...${NC}"
      npm install
    fi
    
    echo -e "${GREEN}Starting backend server...${NC}"
    npm run dev &
    BACKEND_PID=$!
    
    cd ..
    echo -e "\n${BLUE}Step 3: Open the frontend in your browser${NC}"
    
    # Detect the operating system and open the browser
    case "$(uname -s)" in
      Darwin)
        open frontend/index.html
        ;;
      Linux)
        if command -v xdg-open &> /dev/null; then
          xdg-open frontend/index.html
        else
          echo -e "${YELLOW}Please open frontend/index.html in your browser${NC}"
        fi
        ;;
      CYGWIN*|MINGW*|MSYS*)
        start frontend/index.html
        ;;
      *)
        echo -e "${YELLOW}Please open frontend/index.html in your browser${NC}"
        ;;
    esac
    
    echo -e "\n${GREEN}Application started successfully!${NC}"
    echo -e "${YELLOW}Press Ctrl+C to shut down the application${NC}"
    
    # Wait for backend to exit
    wait $BACKEND_PID
    ;;
  3)
    echo -e "\n${BLUE}Starting test server with mock APIs...${NC}"
    cd backend
    if [ ! -d "node_modules" ]; then
      echo -e "${YELLOW}Installing backend dependencies...${NC}"
      npm install express
    fi
    
    echo -e "${GREEN}Starting test server...${NC}"
    node test-apis.js &
    TEST_PID=$!
    
    cd ..
    echo -e "\n${BLUE}Opening frontend in your browser...${NC}"
    
    # Detect the operating system and open the browser
    case "$(uname -s)" in
      Darwin)
        open frontend/index.html
        ;;
      Linux)
        if command -v xdg-open &> /dev/null; then
          xdg-open frontend/index.html
        else
          echo -e "${YELLOW}Please open frontend/index.html in your browser${NC}"
        fi
        ;;
      CYGWIN*|MINGW*|MSYS*)
        start frontend/index.html
        ;;
      *)
        echo -e "${YELLOW}Please open frontend/index.html in your browser${NC}"
        ;;
    esac
    
    echo -e "\n${GREEN}Test server running on http://localhost:3030${NC}"
    echo -e "${YELLOW}Press Ctrl+C to shut down the test server${NC}"
    
    # Wait for test server to exit
    wait $TEST_PID
    ;;
  q|Q)
    echo -e "\n${RED}Exiting...${NC}"
    exit 0
    ;;
  *)
    echo -e "\n${RED}Invalid option. Exiting...${NC}"
    exit 1
    ;;
esac 