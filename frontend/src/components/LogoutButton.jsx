// ✅ FILE: /frontend/src/components/LogoutButton.jsx

import React from "react";
import { useAuth } from "@/contexts";
import Button from "./ui/Button";
import Tooltip from "./ui/Tooltip";

const LogoutButton = () => {
  const { logout } = useAuth();

  return (
    <Tooltip content="Logout">
      <Button
        variant="outline"
        onClick={logout}
        aria-label="Logout"
        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
      >
        Logout
      </Button>
    </Tooltip>
  );
};

export default LogoutButton;
