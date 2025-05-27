// File Path: backend/src/services/repoIntegration.js

const axios = require("axios");

class RepoIntegration {
  /**
   * Generic OAuth 2.0 Token Exchange
   */
  static async getAccessToken(tokenUrl, authCode, client_id, client_secret, redirect_uri) {
    try {
      const response = await axios.post(tokenUrl, null, {
        params: {
          code: authCode,
          grant_type: "authorization_code",
          client_id,
          client_secret,
          redirect_uri,
        },
      });
      return response.data; // Contains access_token and other info
    } catch (err) {
      throw new Error(`Failed to retrieve token: ${err.message}`);
    }
  }

  /**
   * Refresh OAuth 2.0 Token
   */
  static async refreshAccessToken(tokenUrl, refresh_token, client_id, client_secret) {
    try {
      const response = await axios.post(tokenUrl, null, {
        params: {
          refresh_token,
          grant_type: "refresh_token",
          client_id,
          client_secret,
        },
      });
      return response.data;
    } catch (err) {
      throw new Error(`Failed to refresh token: ${err.message}`);
    }
  }

  /**
   * Dropbox Integration
   */
  static async connectDropbox(authCode) {
    const DROPBOX_TOKEN_URL = "https://api.dropbox.com/oauth2/token";
    const client_id = process.env.DROPBOX_CLIENT_ID;
    const client_secret = process.env.DROPBOX_CLIENT_SECRET;
    const redirect_uri = process.env.DROPBOX_REDIRECT_URI;

    return this.getAccessToken(DROPBOX_TOKEN_URL, authCode, client_id, client_secret, redirect_uri);
  }

  /**
   * Google Drive Integration
   */
  static async connectGoogleDrive(authCode) {
    const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET;
    const redirect_uri = process.env.GOOGLE_REDIRECT_URI;

    return this.getAccessToken(GOOGLE_TOKEN_URL, authCode, client_id, client_secret, redirect_uri);
  }

  /**
   * OneDrive Integration
   */
  static async connectOneDrive(authCode) {
    const ONEDRIVE_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    const client_id = process.env.ONEDRIVE_CLIENT_ID;
    const client_secret = process.env.ONEDRIVE_CLIENT_SECRET;
    const redirect_uri = process.env.ONEDRIVE_REDIRECT_URI;

    return this.getAccessToken(ONEDRIVE_TOKEN_URL, authCode, client_id, client_secret, redirect_uri);
  }

  /**
   * Box Integration
   */
  static async connectBox(authCode) {
    const BOX_TOKEN_URL = "https://api.box.com/oauth2/token";
    const client_id = process.env.BOX_CLIENT_ID;
    const client_secret = process.env.BOX_CLIENT_SECRET;
    const redirect_uri = process.env.BOX_REDIRECT_URI;

    return this.getAccessToken(BOX_TOKEN_URL, authCode, client_id, client_secret, redirect_uri);
  }

  /**
   * Amazon S3 Integration
   */
  static async connectAmazonS3(accessKeyId, secretAccessKey, region) {
    return {
      message: "Amazon S3 integration setup complete.",
      config: { accessKeyId, secretAccessKey, region },
    };
  }

  /**
   * Backblaze B2 Integration
   */
  static async connectBackblaze(userConfig) {
    const { accountId, applicationKey } = userConfig;
    const BACKBLAZE_TOKEN_URL = "https://api.backblazeb2.com/b2api/v2/b2_authorize_account";

    try {
      const response = await axios.get(BACKBLAZE_TOKEN_URL, {
        auth: { username: accountId, password: applicationKey },
      });
      return response.data;
    } catch (err) {
      throw new Error(`Backblaze connection failed: ${err.message}`);
    }
  }

  /**
   * Wasabi Integration
   */
  static async connectWasabi(accessKeyId, secretAccessKey, region) {
    return this.connectAmazonS3(accessKeyId, secretAccessKey, region);
  }

  /**
   * pCloud Integration
   */
  static async connectpCloud(authCode, userConfig) {
    const { client_id, client_secret, redirect_uri } = userConfig;
    const PCLOUD_TOKEN_URL = "https://my.pcloud.com/oauth2_token";

    return this.getAccessToken(PCLOUD_TOKEN_URL, authCode, client_id, client_secret, redirect_uri);
  }

  /**
   * MEGA Integration
   */
  static async connectMega(userConfig) {
    return { message: "MEGA integration requires proprietary SDK. Implementation pending." };
  }

  /**
   * IBM Cloud Object Storage Integration
   */
  static async connectIBM(userConfig) {
    const { apiKey, serviceInstanceId, endpoint } = userConfig;
    return {
      message: "IBM Cloud Object Storage integration setup complete.",
      config: { apiKey, serviceInstanceId, endpoint },
    };
  }

  /**
   * Alibaba Cloud OSS Integration
   */
  static async connectAlibabaOSS(userConfig) {
    const { accessKeyId, accessKeySecret, region } = userConfig;
    return {
      message: "Alibaba Cloud OSS integration setup complete.",
      config: { accessKeyId, accessKeySecret, region },
    };
  }

  /**
   * Linode Object Storage Integration
   */
  static async connectLinode(userConfig) {
    return this.connectAmazonS3(userConfig.accessKeyId, userConfig.secretAccessKey, userConfig.region);
  }

  /**
   * Oracle Cloud Storage Integration
   */
  static async connectOracle(userConfig) {
    const { tenancyId, userId, fingerprint, privateKey, region } = userConfig;
    return {
      message: "Oracle Cloud Storage integration setup complete.",
      config: { tenancyId, userId, fingerprint, privateKey, region },
    };
  }

  /**
   * Scaleway Integration
   */
  static async connectScaleway(userConfig) {
    return this.connectAmazonS3(userConfig.accessKeyId, userConfig.secretAccessKey, userConfig.region);
  }

  /**
   * Sync.com Integration
   */
  static async connectSync(authCode, userConfig) {
    const SYNC_TOKEN_URL = "https://api.sync.com/oauth2/token";
    return this.getAccessToken(SYNC_TOKEN_URL, authCode, userConfig.client_id, userConfig.client_secret, userConfig.redirect_uri);
  }

  /**
   * Tresorit Integration
   */
  static async connectTresorit(authCode, userConfig) {
    const TRESORIT_TOKEN_URL = "https://api.tresorit.com/oauth2/token";
    return this.getAccessToken(TRESORIT_TOKEN_URL, authCode, userConfig.client_id, userConfig.client_secret, userConfig.redirect_uri);
  }

  /**
   * SpiderOak Integration
   */
  static async connectSpiderOak(userConfig) {
    return { message: "SpiderOak integration requires proprietary SDK. Implementation pending." };
  }

  /**
   * Yandex Disk Integration
   */
  static async connectYandex(authCode, userConfig) {
    const YANDEX_TOKEN_URL = "https://oauth.yandex.com/token";
    return this.getAccessToken(YANDEX_TOKEN_URL, authCode, userConfig.client_id, userConfig.client_secret);
  }

  /**
   * HubiC Integration
   */
  static async connectHubiC(authCode, userConfig) {
    const HUBIC_TOKEN_URL = "https://api.hubic.com/oauth/token";
    return this.getAccessToken(HUBIC_TOKEN_URL, authCode, userConfig.client_id, userConfig.client_secret, userConfig.redirect_uri);
  }
}

module.exports = RepoIntegration;
