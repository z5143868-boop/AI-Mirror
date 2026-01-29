import sys
import os

# Add the parent directory to sys.path so we can import from backend
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(os.path.join(parent_dir, 'backend'))

from main import app
