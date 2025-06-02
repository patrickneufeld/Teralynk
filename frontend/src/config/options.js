// ✅ File Path: frontend/src/config/options.js

// ✅ Utility function for dynamic option generation (improves reusability)
const generateOptions = (options) => options.map(({ value, label }) => ({ value, label }));

// ✅ Theme Options
export const themeOptions = generateOptions([
    { value: "light", label: "Light Mode" },
    { value: "dark", label: "Dark Mode" },
]);

// ✅ Email Notification Options
export const emailNotificationOptions = generateOptions([
    { value: true, label: "Enabled" },
    { value: false, label: "Disabled" },
]);

// ✅ Workflow Triggers
export const workflowTriggers = generateOptions([
    { value: "time", label: "Time-Based Trigger" },
    { value: "event", label: "Event-Based Trigger" },
    { value: "manual", label: "Manual Trigger" },
]);

// ✅ Workflow Actions
export const workflowActions = generateOptions([
    { value: "email", label: "Send Email" },
    { value: "slack", label: "Send Slack Notification" },
    { value: "webhook", label: "Call Webhook" },
]);

// ✅ Profile Options (Editable User Fields)
export const profileFields = [
    { key: "name", label: "Name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "password", label: "Password", type: "password" },
];

// ✅ Generic Options for Reusability
export const genericOptions = generateOptions([
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
]);

// ✅ Helper: Map option values to labels for utility functions
export const getLabelFromValue = (options, value) => {
    const match = options.find((option) => option.value === value);
    return match ? match.label : "Unknown";
};

// ✅ Helper: Validate selected options (extensible for additional rules)
export const isValidOption = (options, value) =>
    options.some((option) => option.value === value);

