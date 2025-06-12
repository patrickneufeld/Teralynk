/**
 * OAuth2Client class for handling OAuth 2.0 authentication flows
 */
export class OAuth2Client {
    constructor(config) {
      this.clientId = config?.clientId;
      this.clientSecret = config?.clientSecret;
      this.redirectUri = config?.redirectUri;
      this.authEndpoint = config?.authEndpoint;
      this.tokenEndpoint = config?.tokenEndpoint;
      this.scope = config?.scope || 'openid profile email';
    }
  
    /**
     * Generate the authorization URL for OAuth login
     * @returns {string} Authorization URL
     */
    getAuthorizationUrl() {
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        scope: this.scope,
        state: this.generateState()
      });
  
      return `${this.authEndpoint}?${params.toString()}`;
    }
  
    /**
     * Exchange authorization code for tokens
     * @param {string} code - Authorization code
     * @returns {Promise<Object>} Token response
     */
    async getTokens(code) {
      try {
        const response = await fetch(this.tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code: code,
            redirect_uri: this.redirectUri
          })
        });
  
        if (!response.ok) {
          throw new Error('Failed to get tokens');
        }
  
        return await response.json();
      } catch (error) {
        console.error('Error getting tokens:', error);
        throw error;
      }
    }
  
    /**
     * Refresh access token using refresh token
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<Object>} New tokens
     */
    async refreshAccessToken(refreshToken) {
      try {
        const response = await fetch(this.tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            refresh_token: refreshToken
          })
        });
  
        if (!response.ok) {
          throw new Error('Failed to refresh token');
        }
  
        return await response.json();
      } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
      }
    }
  
    /**
     * Validate state parameter to prevent CSRF attacks
     * @param {string} state - State parameter to validate
     * @returns {boolean} Whether state is valid
     */
    validateState(state) {
      // Implement state validation logic
      return true;
    }
  
    /**
     * Generate random state parameter
     * @returns {string} Random state string
     */
    generateState() {
      return Math.random().toString(36).substring(2, 15);
    }
  
    /**
     * Revoke tokens
     * @param {string} token - Token to revoke
     * @returns {Promise<boolean>} Whether revocation was successful
     */
    async revokeToken(token) {
      try {
        const response = await fetch(`${this.tokenEndpoint}/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            token: token
          })
        });
  
        return response.ok;
      } catch (error) {
        console.error('Error revoking token:', error);
        return false;
      }
    }
  }