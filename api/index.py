import os
import sys
from pathlib import Path

# Add project root to sys.path so 'backend' package imports resolve cleanly
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Optimize for serverless execution: enable cloud mode and disable TF
os.environ["USE_TF"] = "0"
os.environ["LOW_MEMORY_MODE"] = "true"

from backend.main import app
