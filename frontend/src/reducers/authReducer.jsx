// ================================================
// ✅ FILE: /frontend/src/reducers/authReducer.jsx
// Hardened Auth Reducer for Teralynk Frontend
// ================================================

export const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  REFRESH_SUCCESS: 'REFRESH_SUCCESS',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
  INIT_SUCCESS: 'INIT_SUCCESS',
  INIT_ERROR: 'INIT_ERROR'
};

export const initialState = {
  user: null,
  token: null,
  loggedIn: false,
  loading: true,
  initialized: false,
  error: null,
  status: 'initializing',
  sessionExpiry: null,
  authLevel: null,
  securityFlags: {},
  mfaRequired: false,
  deviceVerified: false,
  lastActivity: Date.now()
};

export const authReducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case AUTH_ACTIONS.INIT_SUCCESS:
      return {
        ...state,
        initialized: true,
        loading: false,
        status: 'initialized',
        ...(action.payload || {})
      };

    case AUTH_ACTIONS.INIT_ERROR:
      return {
        ...state,
        initialized: true,
        loading: false,
        error: action.payload?.error || 'Initialization error',
        status: 'error'
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      console.log("AUTH_REDUCER: LOGIN_SUCCESS", action.payload);
      return {
        ...state,
        user: action.payload || {},
        error: null,
        loading: false,
        initialized: true,
        loggedIn: true,
        status: 'authenticated',
        lastActivity: Date.now()
      };

    case AUTH_ACTIONS.LOGIN_ERROR:
      return {
        ...state,
        user: null,
        token: null,
        loggedIn: false,
        loading: false,
        error: action.payload?.error || 'Login failed',
        status: 'error',
        sessionExpiry: null
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false,
        initialized: true,
        status: 'unauthenticated',
        lastActivity: Date.now()
      };

    case AUTH_ACTIONS.REFRESH_SUCCESS:
      return {
        ...state,
        ...(action.payload || {}),
        error: null,
        lastActivity: Date.now()
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: !!action.payload
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

export default authReducer;
