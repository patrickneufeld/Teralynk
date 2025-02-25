// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/LogoutButton.jsx

import React from "react";
import { useAuth } from "../context/AuthContext";

const LogoutButton = () => {
    const { logout } = useAuth();

    return <button onClick={logout}>Logout</button>;
};

export default LogoutButton;
