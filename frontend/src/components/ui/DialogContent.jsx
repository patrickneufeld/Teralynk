// ✅ File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/DialogContent.jsx

import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const DialogContent = ({ children, className = "" }) => {
  return (
    <div className={clsx("px-6 py-4 text-sm text-gray-700", className)}>
      {children}
    </div>
  );
};

DialogContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default DialogContent;
