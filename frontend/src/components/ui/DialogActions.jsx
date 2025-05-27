// ✅ File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/DialogActions.jsx

import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const DialogActions = ({ children, className = "" }) => {
  return (
    <div
      className={clsx(
        "mt-6 flex flex-wrap justify-end items-center gap-3 border-t border-gray-200 pt-4",
        className
      )}
    >
      {children}
    </div>
  );
};

DialogActions.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default DialogActions;
