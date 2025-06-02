import openai
import os
import time
import random
import csv

# ==============================
# CONFIGURATION
# ==============================

openai.api_key = 

project_root = "/Users/patrick/Projects/Teralynk_Old"
frontend_folder = os.path.join(project_root, "frontend")
backend_folder = os.path.join(project_root, "backend")

output_csv_full = "scan_results.csv"
output_csv_backend = "backend_scan_results.csv"

valid_extensions = ('.js', '.jsx', '.ts', '.tsx', '.json', '.env', '.html', '.css')
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
You are an expert software engineer. Perform a comprehensive analysis of my frontend directory to diagnose and resolve issues preventing the project from loading properly.
Conduct static code analysis, dependency audits, and configuration validation to identify errors, including syntax issues, missing modules,
incorrect environment settings, and broken file references. Generate a structured report detailing root causes and proposed solutions,
prioritizing critical fixes. You will refer back to this report as often as needed. Where safe, implement automated corrections while maintaining code integrity and compatibility with existing architectures.
Ensure compliance with best practices, security standards, and performance optimization. Each file needs to be hardened and enterprise grade. Confirm the stability of the project post-fix
and provide recommendations for future-proofing against similar errors.

Your task is to automatically fix issues in frontend and if necessary, backend source files from a professional platform called Teralynk.
The project is complex and includes React frontend with Tailwind CSS, custom WebSocket logic, Vite, and Cognito-based authentication.
This platform is failing to load the frontend properly due to token/session bugs, auth loops, Tailwind/postcss and nesting issues. This is not a complete or comprehensive list of the issues. Refer to your report for additional issues found. Fix all of these and if you find more issues including dependency issues, fix them.
If you need to create a file to fix things, then create the file. You have full autonomy and permission to fix errors.
"""

# ==============================
# FUNCTIONS
# ==============================

def should_exclude(folder_path, filename):
    parts = folder_path.split(os.sep)
    if any(part in excluded_folders for part in parts):
        return True
    return filename in excluded_files

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
        writer.writerow({
            'File': file_path,
            'Status': status,
            'Comments': comments
        })

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
                    wait_time = 10
                    print(f"🚫 Rate limit hit: {str(e)}")
                    time.sleep(wait_time)
                    attempt += 1

                except Exception as e:
                    error_message = str(e)
                    print(f"❗ Error on chunk: {error_message}")
                    if "502 Bad Gateway" in error_message or "502" in error_message:
                        wait_time = random.uniform(10, 15)
                        print(f"🌐 502 error detected. Retrying in {wait_time:.1f} seconds...")
                        time.sleep(wait_time)
                        attempt += 1
                        continue
                    return f"Error: {error_message}"

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
                full_path = os.path.join(root, filename)
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

            print(f"🔧 Fixing {file_path}")
            review = review_file(file_path, content)

            status = (
                "⚠️ Issue Found" if any(k in review.lower() for k in ["problem", "issue", "warning", "error"])
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
        scan_project(backend_folder, output_csv_backend, start_from if start_from else None, force_rescan)
    else:
        print("\n🌐 Full project scan selected!\n")
        scan_project(project_root, output_csv_full, start_from if start_from else None, force_rescan)

    print("\n✅ Scan complete!")
