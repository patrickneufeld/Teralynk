import os
import shutil

# Define the ideal structure for the backend
ideal_structure = {
    "api": [
        "activityLog.js", "admin.js", "authRoutes.js", "chatFileRoutes.js",
        "fileRoutes.js", "healthCheck.js", "workflowRoutes.js"
    ],
    "config": [
        "app.js", "connectDB.js", "environment.js", "logger.js"
    ],
    "middleware": [
        "authMiddleware.js", "rateLimiterMiddleware.js", "errorMiddleware.js"
    ],
    "services/auth": [
        "authService.js"
    ],
    "services/file": [
        "fileService.js", "fileSharingService.js", "fileSyncService.js"
    ],
    "services/common": [
        "cacheService.js", "securityService.js", "loggingService.js"
    ],
    "uploads": [],  # Placeholder for uploads
    "logs": [],  # Placeholder for logs
}

# Current project directory
project_root = "/Users/patrick/Projects/Teralynk/backend/src"

# Function to move files to their ideal locations
def reorganize_structure(base_path, structure):
    for target_dir, files in structure.items():
        full_target_dir = os.path.join(base_path, target_dir)
        os.makedirs(full_target_dir, exist_ok=True)  # Create target directories

        for file_name in files:
            # Find the file in the current structure and move it
            for root, _, files_in_dir in os.walk(base_path):
                if file_name in files_in_dir:
                    src = os.path.join(root, file_name)
                    dst = os.path.join(full_target_dir, file_name)
                    shutil.move(src, dst)
                    print(f"Moved: {src} -> {dst}")

# Execute the reorganization for the backend
reorganize_structure(project_root, ideal_structure)
