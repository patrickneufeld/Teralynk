// ✅ FILE: /frontend/src/components/dashboard/Files.jsx

import React from "react";
import Card from "../../components/ui/Card";

const Files = () => {
  return (
    <div className="p-6">
      <Card>
        <h1 className="text-2xl font-bold mb-4">Your Files</h1>
        <p>This page will show all uploaded or synced files.</p>
        {/* Add file list/table logic here */}
      </Card>
    </div>
  );
};

export default Files;
