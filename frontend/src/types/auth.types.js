import PropTypes from 'prop-types';

export const userPropTypes = {
  id: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  name: PropTypes.string,
  role: PropTypes.string.isRequired,
  displayName: PropTypes.string,
  lastLogin: PropTypes.string,
  settings: PropTypes.object,
  permissions: PropTypes.arrayOf(PropTypes.string),
  services: PropTypes.arrayOf(PropTypes.object)
};

export const authContextPropTypes = {
  children: PropTypes.node.isRequired,
};

export const authStatePropTypes = {
  user: PropTypes.shape(userPropTypes),
  loggedIn: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  errorDetails: PropTypes.object,
  services: PropTypes.array,
  settings: PropTypes.object,
  lastAuthenticated: PropTypes.string,
  status: PropTypes.string.isRequired,
  permissions: PropTypes.array,
  sessionExpiry: PropTypes.instanceOf(Date)
};

export const authActionsPropTypes = {
  login: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  updateUserSettings: PropTypes.func.isRequired,
  updateUserProfile: PropTypes.func.isRequired,
  checkAuthStatus: PropTypes.func.isRequired,
  hasPermission: PropTypes.func.isRequired
};