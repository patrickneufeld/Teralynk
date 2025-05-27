// ✅ FILE: /frontend/src/components/StorageLocationDetails.jsx

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

// Enterprise-grade Storage Location Detail Component
const StorageLocationDetails = React.memo(({ locationName, locationType, lastSynced, description }) => {
  useEffect(() => {
    console.debug('[StorageLocationDetails] Component mounted', {
      locationName,
      locationType
    });
  }, [locationName, locationType]);

  try {
    return (
      <section
        className="storage-details p-4 border border-gray-200 rounded-md shadow-md bg-white"
        role="region"
        aria-labelledby="storageDetailsTitle"
        data-testid="storage-location-details"
      >
        <h2 id="storageDetailsTitle" className="text-xl font-semibold text-gray-800 mb-2">
          {locationName || 'Storage Location'}
        </h2>

        <ul className="text-sm text-gray-700 space-y-1">
          <li><strong>Type:</strong> {locationType || 'N/A'}</li>
          <li><strong>Last Synced:</strong> {lastSynced ? new Date(lastSynced).toLocaleString() : 'Unknown'}</li>
          {description && <li><strong>Description:</strong> {description}</li>}
        </ul>
      </section>
    );
  } catch (error) {
    console.error('[StorageLocationDetails] Render error:', error);
    return (
      <div
        className="storage-details-error p-4 border border-red-400 bg-red-50 text-red-800 rounded-md"
        role="alert"
        data-testid="storage-location-error"
      >
        <strong>Error:</strong> Unable to load storage location details.
      </div>
    );
  }
});

StorageLocationDetails.propTypes = {
  locationName: PropTypes.string,
  locationType: PropTypes.string,
  lastSynced: PropTypes.string,
  description: PropTypes.string
};

StorageLocationDetails.defaultProps = {
  locationName: 'Unnamed Storage',
  locationType: 'Generic',
  lastSynced: null,
  description: ''
};

export default StorageLocationDetails;
