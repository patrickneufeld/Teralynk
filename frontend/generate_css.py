import os

# Define the empty CSS files
empty_files = [
    "WidgetManager.css", "LogoutButton.css", "DraggableWidget.css",
    "DataAnalysis.css", "S3FileUpload.css", "SystemAlerts.css",
    "DashboardBuilder.css", "LogPage.css", "AIIntegration.css",
    "BusinessProposal.css", "AIModelTraining.css", "AuditLog.css",
    "FileIcon.css", "S3FileExplorer.css", "FileVersioning.css",
    "UserRoles.css", "FilesPage.css", "Insights.css", "SecretsFetcher.css"
]

# Base path for the CSS files
base_path = "/Users/patrick/Projects/Teralynk/frontend/src/styles/components"

# Define a CSS template based on the Navbar.css patterns
css_template = """/* Light Mode Variables */
:root {{
    --primary-bg: #f9f9f9;
    --primary-text: #333;
    --secondary-bg: #eaeaea;
    --secondary-text: #555;
    --hover-bg: #ddd;
    --hover-text: #111;
    --font-size: 16px;
    --spacing: 10px;
    --border-radius: 4px;
}}

/* Dark Mode Variables */
body.dark-mode {{
    --primary-bg: #1e1e1e;
    --primary-text: #fff;
    --secondary-bg: #2a2a2a;
    --secondary-text: #ccc;
    --hover-bg: #444;
    --hover-text: #fff;
}}

/* {component_name} Container */
.{component_name}-container {{
    background-color: var(--primary-bg);
    color: var(--primary-text);
    padding: var(--spacing);
    border-radius: var(--border-radius);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}}

/* Title */
.{component_name}-title {{
    font-size: 1.5rem;
    margin-bottom: var(--spacing);
}}

/* Content Section */
.{component_name}-content {{
    background-color: var(--secondary-bg);
    color: var(--secondary-text);
    padding: calc(var(--spacing) * 1.5);
    border-radius: var(--border-radius);
}}

/* Button */
.{component_name}-button {{
    background-color: var(--primary-text);
    color: var(--primary-bg);
    border: none;
    padding: 10px 20px;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: background-color 0.3s ease;
}}

.{component_name}-button:hover {{
    background-color: var(--hover-bg);
    color: var(--hover-text);
}}

/* Responsive Design */
@media (max-width: 768px) {{
    .{component_name}-container {{
        padding: calc(var(--spacing) * 0.8);
    }}
}}
"""

# Generate the CSS files
for file in empty_files:
    file_path = os.path.join(base_path, file)
    component_name = file.replace(".css", "")
    with open(file_path, "w") as f:
        f.write(css_template.format(component_name=component_name))
        print(f"Generated {file_path}")

print("CSS files generated successfully.")
