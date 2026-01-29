import sys
import os
from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Add the parent directory to sys.path so we can import from backend
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(os.path.join(parent_dir, 'backend'))

try:
    from main import app
except Exception as e:
    # Fallback app to display import errors
    app = FastAPI()
    
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE"])
    async def catch_all(path_name: str):
        import traceback
        return JSONResponse(
            status_code=500,
            content={
                "error": "Backend Import Failed", 
                "detail": str(e),
                "traceback": traceback.format_exc(),
                "sys_path": sys.path,
                "files_in_backend": os.listdir(os.path.join(parent_dir, 'backend')) if os.path.exists(os.path.join(parent_dir, 'backend')) else "backend_not_found"
            }
        )
