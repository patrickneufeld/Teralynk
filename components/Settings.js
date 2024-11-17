import React, { useState } from 'react';

const Settings = () => {
    const [settings, setSettings] = useState({
        emailNotifications: true,
        darkMode: false
    });

    const handleToggle = (e) => {
        const { name, checked } = e.target;
        setSettings({
            ...settings,
            [name]: checked
        });
    };

    const handleSave = () => {
        // Save settings to backend or localStorage
        console.log('Settings saved:', settings);
    };

    return (
        <div className="settings">
            <h2>Settings</h2>
            <label>
                Email Notifications:
                <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={handleToggle}
                />
            </label>
            <label>
                Dark Mode:
                <input
                    type="checkbox"
                    name="darkMode"
                    checked={settings.darkMode}
                    onChange={handleToggle}
                />
            </label>
            <button onClick={handleSave}>Save Settings</button>
        </div>
    );
};

export default Settings;
