@echo off
echo Starting AI Mirror...

echo Installing backend dependencies...
cd backend
python -m pip install -r requirements.txt
cd ..

echo Starting services...
start "Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
start "Frontend" cmd /k "cd frontend && npm run dev"

echo Backend running on http://localhost:8000
echo Frontend running on http://localhost:5173
echo.
echo Please wait for services to start...
pause
