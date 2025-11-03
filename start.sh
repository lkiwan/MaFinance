#!/bin/bash
# Start script for Render deployment

echo "Starting MaFinance Pro..."

# Run with gunicorn
gunicorn --bind 0.0.0.0:$PORT app:app --workers 2 --timeout 120
