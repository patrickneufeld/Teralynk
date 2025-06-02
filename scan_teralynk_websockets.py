import openai
import os
import time
import random
import csv

# ==============================
# CONFIGURATION
# ==============================

# OpenAI API Key
openai.api_key =

# Paths
project_root = "/Users/patrick/Projects/Teralynk_Old"
backend_folder = os.path.join(project_root, "backend")

# CSV output files
output_csv_full = "scan_results.csv"
output_csv_backend = "backend_scan_results.csv"

# Valid file extensions
valid_extensions = ('.js', '.jsx', '.ts', '.tsx', '.json', '.env')

# Folders and files to exclude
excluded_folders = {'node_modules', 'build', 'dist', '.git', '.next', '.vercel', '.vite'}
excluded_files = {'package-lock.json'}

# Chunk size
max_chunk_size = 3000

# API pacing
MIN_PAUSE = 6
MAX_PAUSE = 8

# Error context
error_context = """
IMPORTANT CONTEXT:
Production WebSocket failure:
'WebSocket connection to ws://localhost:undefined failed.'
Investigate missing VITE_WS_PORT, VITE_WS_HOST environment variables, bad fallback logic, or setupWebSocket() bugs.
"""

# ==============================
# FUNCTIONS
# ==============================

def load_already_scanned_files(filename):
    scanned = set()
    if os.path.exists(filename):
        with open(filename, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                scanned.add(row['File'])
    return scanned

def review_file(file_path, file_content):
    try:
        if len(file_content) <= max_chunk_size:
            chunks = [file_content]
        else:
            chunks = [file_content[i:i+max_chunk_size] for i in range(0, len(file_content), max_chunk_size)]

        all_reviews = []

        for idx, chunk in enumerate(chunks):
            attempt = 0
            success = False

            while not success:
                try:
                    print(f"    ✂️ Sending chunk {idx+1}/{len(chunks)} for {file_path} (Attempt {attempt+1})...")

                    response = openai.ChatCompletion.create(
                        model="gpt-4o",
                        messages=[
                            {
                                "role": "system",
                                "content": (
                                    "You are an expert engineer specializing in WebSocket, server environment, backend config, and client/server bugs."
                                    "\n\n" + error_context
                                )
                            },
                            {
                                "role": "user",
                                "content": f"Analyze this code chunk carefully:\n\n{chunk}"
                            }
                        ],
                        temperature=0
                    )

                    review_text = response['choices'][0]['message']['content']
                    all_reviews.append(review_text)
                    success = True

                    sleep_time = random.uniform(MIN_PAUSE, MAX_PAUSE)
                    print(f"    ⏳ Waiting {sleep_time:.1f} seconds before next chunk...")
                    time.sleep(sleep_time)

                except openai.error.RateLimitError as e:
                    wait_time = 10
                    error_message = str(e)
                    print(f"    🚫 Rate limit hit: {error_message}")

                    if "Please try again in" in error_message:
                        try:
                            wait_str = error_message.split("Please try again in")[1]
                            wait_time = float(wait_str.split('s')[0].strip())
                        except Exception:
                            pass

                    print(f"    ⏳ Waiting {wait_time:.1f} seconds before retrying...")
                    time.sleep(wait_time)

                    attempt += 1

                except Exception as e:
                    print(f"❗ Unexpected error reviewing {file_path}: {e}")
                    return f"Error reviewing file: {e}"

        return "\n\n".join(all_reviews)

    except Exception as e:
        print(f"❗ General error reviewing {file_path}: {e}")
        return f"Error reviewing file: {e}"

def should_exclude(folder_path, filename):
    for excluded in excluded_folders:
        if excluded in folder_path:
            return True
    if filename in excluded_files:
        return True
    return False

def append_result_to_csv(csv_file, file_path, status, comments):
    file_exists = os.path.isfile(csv_file)
    with open(csv_file, mode='a', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['File', 'Status', 'Comments']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        if not file_exists:
            writer.writeheader()

        writer.writerow({
            'File': file_path,
            'Status': status,
            'Comments': comments
        })

def scan_project(project_path, csv_output, start_from=None, force_rescan=False):
    already_scanned = load_already_scanned_files(csv_output) if not force_rescan else set()
    files_to_scan = []

    for root, dirs, files in os.walk(project_path):
        dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d), '')]

        for filename in sorted(files):
            if filename.endswith(valid_extensions) and not should_exclude(root, filename):
                file_path = os.path.join(root, filename)
                files_to_scan.append(file_path)

    if start_from:
        print(f"🔵 Resuming scan starting from file: {start_from}")
        files_to_scan = [f for f in files_to_scan if f >= start_from]

    print(f"\n📋 {len(files_to_scan)} files to scan.\n")

    for file_path in files_to_scan:
        if not force_rescan and file_path in already_scanned:
            print(f"⏩ Skipping already scanned: {file_path}")
            continue

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            print(f"🔍 Scanning {file_path}...")

            review = review_file(file_path, content)

            if review:
                if any(keyword in review.lower() for keyword in ["problem", "issue", "warning", "error"]):
                    status = "⚠️ Issue Found"
                else:
                    status = "✅ No Major Issues"
            else:
                status = "❗ Error"

            print(f"    ➡️ {status}")

            append_result_to_csv(csv_output, file_path, status, review)

        except Exception as e:
            print(f"❗ Failed to read {file_path}: {e}")
            append_result_to_csv(csv_output, file_path, "❗ Error", str(e))

# ==============================
# MAIN
# ==============================

if __name__ == "__main__":
    print("🚀 Starting project scan...\n")

    mode = input("Which mode? (full / backend): ").strip().lower()
    start_from = input("Start from specific file? (leave blank if not): ").strip()
    force_rescan_input = input("Rescan files even if already scanned? (yes/no): ").strip().lower()
    force_rescan = force_rescan_input == 'yes'

    if mode == "backend":
        print("\n📂 Backend-only scan selected!\n")
        if not os.path.exists(output_csv_backend):
            with open(output_csv_backend, mode='w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=['File', 'Status', 'Comments'])
                writer.writeheader()

        scan_project(backend_folder, output_csv_backend, start_from if start_from else None, force_rescan)

    else:
        print("\n🌐 Full project scan selected!\n")
        scan_project(project_root, output_csv_full, start_from if start_from else None, force_rescan)

    print("\n✅ Scan complete!")
