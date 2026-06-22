#!/bin/bash
cd "$(dirname "$0")/splendor-pokemon"
echo "======================================"
echo " 璀璨宝石：宝可梦 Splendor Pokemon"
echo "======================================"
echo ""
echo "Starting game server..."
echo "PC: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop"
echo "======================================"
npm run dev -- --host 0.0.0.0
