// ✅ FILE: /frontend/src/components/layout/SidebarItem.jsx

import React from "react";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";

/**
 * SidebarItem - Renders an individual sidebar navigation link
 *
 * @param {string} label - Display name of the item
 * @param {function} icon - Lucide or custom icon component
 * @param {string} to - Destination path
 */
const SidebarItem = ({ label, icon: Icon, to }) => {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "group flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
          isActive
            ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-white"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
        ].join(" ")
      }
      role="menuitem"
      aria-label={label}
      title={label}
    >
      {Icon && (
        <Icon
          className="h-5 w-5 mr-3 shrink-0 text-inherit"
          aria-hidden="true"
        />
      )}
      <span className="truncate">{label}</span>
    </NavLink>
  );
};

SidebarItem.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  to: PropTypes.string.isRequired,
};

export default SidebarItem;
