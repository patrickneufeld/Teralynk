// File Path: frontend/src/config/options.js

// Theme Options
export const themeOptions = [
    { value: 'light', label: 'Light Mode' },
    { value: 'dark', label: 'Dark Mode' },
];

// Email Notification Options
export const emailNotificationOptions = [
    { value: true, label: 'Enabled' },
    { value: false, label: 'Disabled' },
];

// Workflow Triggers
export const workflowTriggers = [
    { value: 'time', label: 'Time-Based Trigger' },
    { value: 'event', label: 'Event-Based Trigger' },
    { value: 'manual', label: 'Manual Trigger' },
];

// Workflow Actions
export const workflowActions = [
    { value: 'email', label: 'Send Email' },
    { value: 'slack', label: 'Send Slack Notification' },
    { value: 'webhook', label: 'Call Webhook' },
];

// Profile Options (Editable User Fields)
export const profileFields = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'password', label: 'Password', type: 'password' },
];

// Generic Options for Reusability
export const genericOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
];
