// ✅ File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/DialogTitle.jsx

import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const DialogTitle = ({ children, className = "" }) => {
  return (
    <h2 className={clsx("text-xl font-semibold text-gray-900 px-6 pt-6", className)}>
      {children}
    </h2>
  );
};

DialogTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default DialogTitle;
