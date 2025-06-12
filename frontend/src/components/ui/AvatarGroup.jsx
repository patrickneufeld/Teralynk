import React from "react";
import PropTypes from "prop-types";
import { Avatar } from "./Avatar"; // Changed to named import

/**
 * AvatarGroup displays a set of overlapping avatars
 */
export const AvatarGroup = ({ users = [], maxVisible = 4, size = "md" }) => { // Changed to named export
  const visibleUsers = users.slice(0, maxVisible);
  const hiddenCount = users.length - visibleUsers.length;

  return (
    <div className="flex items-center -space-x-3">
      {visibleUsers.map((user, index) => (
        <Avatar
          key={index}
          src={user.avatar}
          fallbackText={user.initials || user.name?.[0]}
          alt={user.name}
          size={size}
          className="ring-2 ring-white"
        />
      ))}

      {hiddenCount > 0 && (
        <div
          className={`inline-flex items-center justify-center rounded-full bg-gray-300 text-gray-700 font-semibold ring-2 ring-white ${
            {
              sm: "h-8 w-8 text-sm",
              md: "h-12 w-12 text-base",
              lg: "h-16 w-16 text-lg",
              xl: "h-20 w-20 text-xl",
            }[size]
          }`}
        >
          +{hiddenCount}
        </div>
      )}
    </div>
  );
};

AvatarGroup.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      avatar: PropTypes.string,
      name: PropTypes.string,
      initials: PropTypes.string,
    })
  ),
  maxVisible: PropTypes.number,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
};