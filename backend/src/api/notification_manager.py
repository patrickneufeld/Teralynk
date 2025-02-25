# /Users/patrick/Projects/Teralynk/backend/src/api/notification_manager.py

import smtplib
import requests
from pymongo import MongoClient
import datetime
import os

# MongoDB Setup
mongo_uri = "mongodb://localhost:27017/"
client = MongoClient(mongo_uri)
db = client["teralynk_ai"]
notifications_collection = db["ai_notifications"]

# Email & Slack Configuration
SMTP_SERVER = "smtp.gmail.com"  # Change to your email provider
SMTP_PORT = 587
EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")

def send_email(recipient, subject, message):
    """
    Sends an email notification.
    """
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        msg = f"Subject: {subject}\n\n{message}"
        server.sendmail(EMAIL_SENDER, recipient, msg)
        server.quit()
        print("📧 Email Sent Successfully!")
    except Exception as e:
        print(f"❌ Email Notification Failed: {e}")

def send_slack_notification(message):
    """
    Sends a Slack notification.
    """
    try:
        requests.post(SLACK_WEBHOOK_URL, json={"text": message})
        print("💬 Slack Notification Sent!")
    except Exception as e:
        print(f"❌ Slack Notification Failed: {e}")

def create_notification(update_details, notification_type="AI Optimization", requires_approval=False):
    """
    Logs a new AI notification and sends email/Slack alerts if needed.
    """
    notification = {
        "timestamp": datetime.datetime.utcnow(),
        "update_details": update_details,
        "type": notification_type,
        "status": "Pending Approval" if requires_approval else "Informational"
    }
    notifications_collection.insert_one(notification)

    # Send notifications
    email_message = f"New AI Notification:\n\n{update_details}"
    slack_message = f"🚀 *New AI Notification:* {update_details}"

    if requires_approval:
        send_email("admin@example.com", "AI Optimization Approval Needed", email_message)
        send_slack_notification(slack_message)

if __name__ == "__main__":
    # Example Usage
    create_notification("AI model retraining triggered due to high error rates.", "Retraining Trigger", False)
