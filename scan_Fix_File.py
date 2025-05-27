# /path/to/scan_txt_dependency_checker.py

import openai
import os
import time
import random
import csv

# ==============================
# CONFIGURATION
# ==============================

openai.api_key = os.getenv("OPENAI_API_KEY")  # Load from secure environment variable

if not openai.api_key:
    raise ValueError("❌ OPENAI_API_KEY is not set in the environment!")

project_root = "/Users/patrick/downloads/FileScan"
frontend_folder = os.path.join(project_root, "frontend")
backend_folder = os.path.join(project_root, "backend")

output_csv_full = "scan_results.csv"
output_csv_backend = "backend_scan_results.csv"

valid_extensions = ('.txt',)
excluded_folders = {'node_modules', 'build', 'dist', '.git', '.next', '.vercel', '.vite'}
excluded_files = {'package-lock.json'}

max_chunk_size = 3000
MIN_PAUSE = 6
MAX_PAUSE = 8

error_context = """
IMPORTANT CONTEXT:
Production WebSocket failure:
'WebSocket connection to ws://localhost:undefined failed.'
Investigate missing VITE_WS_PORT, VITE_WS_HOST environment variables, bad fallback logic, or setupWebSocket() bugs.
"""

analysis_prompt = """
You are an expert software engineer and static analysis tool. I am providing you two .txt files that contain the full contents of my project's frontend and backend directories. Your task is to:
Scan all JavaScript/TypeScript/Node/React/Vite files (frontend) and Express/Node/Sequelize/PostgreSQL/server-side code (backend) for usage of packages, imports, and framework features.
Identify any missing or unused dependencies based on the code.
Suggest the correct versions or package names if they are missing from package.json or incorrectly referenced in the code.
Highlight common issues such as:
- Module not found errors due to missing npm packages
- Mismatched or outdated import styles
- Unused packages bloating the project
- Runtime-only vs dev-only dependency misclassifications
Clearly organize your results into two sections:
✅ Frontend Dependency Analysis
✅ Backend Dependency Analysis
Also include a final section titled:
👉 🛠️ Suggested package.json Fixes – with a list of npm install or npm uninstall commands to fix the project state.
You should assume:
- The frontend uses React + Vite + Tailwind
- The backend is built with Express, Sequelize, PostgreSQL, Redis, and AWS SDKs
Only report concrete and high-confidence findings based on actual code usage patterns in the .txt files.
"""

# ==============================
# FUNCTIONS
# ==============================

def should_exclude(folder_path, filename):
    parts = folder_path.split(os.sep)
    return any(part in excluded_folders for part in parts) or filename in excluded_files

def load_already_scanned_files(filename):
    scanned = set()
    if os.path.exists(filename):
        with open(filename, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                scanned.add(row['File'])
    return scanned

def append_result_to_csv(csv_file, file_path, status, comments):
    file_exists = os.path.isfile(csv_file)
    with open(csv_file, mode='a', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['File', 'Status', 'Comments']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow({'File': file_path, 'Status': status, 'Comments': comments})

def review_file(file_path, file_content):
    try:
        chunks = [file_content[i:i+max_chunk_size] for i in range(0, len(file_content), max_chunk_size)] or [file_content]
        all_reviews = []

        for idx, chunk in enumerate(chunks):
            attempt = 0
            success = False
            while not success:
                try:
                    print(f"🧠 Chunk {idx+1}/{len(chunks)} for {file_path}")
                    response = openai.ChatCompletion.create(
                        model="gpt-4o",
                        messages=[
                            {"role": "system", "content": analysis_prompt + error_context},
                            {"role": "user", "content": chunk}
                        ],
                        temperature=0.2
                    )
                    result = response['choices'][0]['message']['content']
                    all_reviews.append(result)
                    success = True
                    time.sleep(random.uniform(MIN_PAUSE, MAX_PAUSE))

                except openai.error.RateLimitError as e:
                    print(f"🚫 Rate limit hit: {str(e)}")
                    time.sleep(random.uniform(10, 20))
                    attempt += 1

                except Exception as e:
                    print(f"❗ Error on chunk: {e}")
                    if "502" in str(e):
                        time.sleep(random.uniform(10, 15))
                        attempt += 1
                        continue
                    return f"Error: {e}"

        return "\n\n".join(all_reviews)

    except Exception as e:
        return f"Error during chunking: {e}"

def scan_project(project_path, csv_output, start_from=None, force_rescan=False):
    already_scanned = load_already_scanned_files(csv_output) if not force_rescan else set()
    files_to_scan = []

    for root, dirs, files in os.walk(project_path):
        dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d), '')]
        for filename in sorted(files):
            if filename.endswith(valid_extensions) and not should_exclude(root, filename):
                full_path = os.path.normpath(os.path.join(root, filename))
                files_to_scan.append(full_path)

    if start_from:
        print(f"🔵 Resuming from file: {start_from}")
        files_to_scan = [f for f in files_to_scan if f >= start_from]

    print(f"\n📋 {len(files_to_scan)} files to scan.\n")

    for file_path in files_to_scan:
        if not force_rescan and file_path in already_scanned:
            print(f"⏩ Skipping already scanned: {file_path}")
            continue

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            print(f"🔧 Scanning {file_path}")
            review = review_file(file_path, content)

            status = (
                "⚠️ Issue Found" if any(k in review.lower() for k in ["problem", "issue", "warning", "missing", "error", "fix"])
                else "✅ No Major Issues"
            ) if review else "❗ Error"

            append_result_to_csv(csv_output, file_path, status, review)

        except Exception as e:
            print(f"❗ Failed: {file_path}: {e}")
            append_result_to_csv(csv_output, file_path, "❗ Error", str(e))

# ==============================
# MAIN
# ==============================

if __name__ == "__main__":
    print("🚀 Starting full scan...\n")

    mode = input("Which mode? (full / backend): ").strip().lower()
    start_from = input("Start from specific file? (leave blank if not): ").strip()
    force_rescan_input = input("Rescan files even if already scanned? (yes/no): ").strip().lower()
    force_rescan = force_rescan_input == 'yes'

    if mode == "backend":
        print("\n📂 Backend-only scan selected!\n")
        scan_project(backend_folder, output_csv_backend, start_from or None, force_rescan)
    else:
        print("\n🌐 Full project scan selected!\n")
        scan_project(project_root, output_csv_full, start_from or None, force_rescan)

    print("\n✅ Scan complete!")
