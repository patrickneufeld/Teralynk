# /Users/patrick/Projects/Teralynk/backend/src/api/weekly_report.py

from pymongo import MongoClient
import datetime
import smtplib
import os

# MongoDB Connection
mongo_uri = "mongodb://localhost:27017/"
client = MongoClient(mongo_uri)
db = client["teralynk_ai"]
performance_logs = db["ai_performance_logs"]

# Email Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
ADMIN_EMAIL = "admin@example.com"

def generate_weekly_report():
    """
    Generate and send AI performance summary for the past week.
    """
    one_week_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    logs = list(performance_logs.find({"timestamp": {"$gte": one_week_ago}}))

    if not logs:
        return "No AI performance data available for the past week."

    avg_mse = sum(log["mse"] for log in logs) / len(logs)
    avg_mae = sum(log["mae"] for log in logs) / len(logs)

    report = f"""
    AI Weekly Performance Report:
    - Average MSE: {avg_mse:.4f}
    - Average MAE: {avg_mae:.4f}
    - Logs Analyzed: {len(logs)}
    """

    send_email_report(report)
    return report

def send_email_report(report):
    """
    Sends the weekly AI performance report via email.
    """
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        msg = f"Subject: AI Weekly Performance Report\n\n{report}"
        server.sendmail(EMAIL_SENDER, ADMIN_EMAIL, msg)
        server.quit()
        print("📧 AI Weekly Report Sent Successfully!")
    except Exception as e:
        print(f"❌ AI Weekly Report Email Failed: {e}")

if __name__ == "__main__":
    print(generate_weekly_report())
