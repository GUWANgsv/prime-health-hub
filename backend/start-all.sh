#/bin/bash

# This script starts all 7 services in parallel (requires tmux or screen)
# Or run each command in a separate terminal window

echo "Starting Smart Healthcare Backend Services..."
echo ""
echo "Make sure MongoDB is running and .env files are configured!"
echo ""

# Check if tmux is available
if command -v tmux &> /dev/null; then
  echo "Using tmux to start services..."
  
  # Create new session
  tmux new-session -d -s healthcare
  
  # Create windows for each service
  tmux new-window -t healthcare -n gateway
  tmux new-window -t healthcare -n auth
  tmux new-window -t healthcare -n patient
  tmux new-window -t healthcare -n doctor
  tmux new-window -t healthcare -n appointment
  tmux new-window -t healthcare -n notification
  tmux new-window -t healthcare -n ai
  
  # Start services
  tmux send-keys -t healthcare:gateway "cd gateway-service && npm run dev" Enter
  tmux send-keys -t healthcare:auth "cd auth-service && npm run dev" Enter
  tmux send-keys -t healthcare:patient "cd patient-service && npm run dev" Enter
  tmux send-keys -t healthcare:doctor "cd doctor-service && npm run dev" Enter
  tmux send-keys -t healthcare:appointment "cd appointment-service && npm run dev" Enter
  tmux send-keys -t healthcare:notification "cd notification-service && npm run dev" Enter
  tmux send-keys -t healthcare:ai "cd ai-service && npm run dev" Enter
  
  echo "All services started in tmux session 'healthcare'"
  echo ""
  echo "To view logs: tmux attach-session -t healthcare"
  echo "To stop all: tmux kill-session -t healthcare"
else
  echo "tmux not found. Starting services manually..."
  echo ""
  echo "In 7 separate terminal windows, run:"
  echo ""
  echo "Terminal 1: cd gateway-service && npm run dev"
  echo "Terminal 2: cd auth-service && npm run dev"
  echo "Terminal 3: cd patient-service && npm run dev"
  echo "Terminal 4: cd doctor-service && npm run dev"
  echo "Terminal 5: cd appointment-service && npm run dev"
  echo "Terminal 6: cd notification-service && npm run dev"
  echo "Terminal 7: cd ai-service && npm run dev"
  echo ""
  echo "Or use docker-compose:"
  echo "docker-compose up"
fi
