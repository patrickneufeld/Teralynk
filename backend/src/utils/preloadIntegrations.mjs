// File Path: backend/src/utils/preloadIntegrations.js

const UserRepository = require('../../models/UserRepository');

const preloadIntegrations = async () => {
  const integrations = [
    {
      name: 'Dropbox',
      authEndpoint: 'https://api.dropbox.com/oauth2/token',
      clientId: 'your-dropbox-client-id',
      clientSecret: 'your-dropbox-client-secret',
      redirectUri: 'https://yourapp.com/callback/dropbox',
      apiBaseUrl: 'https://api.dropbox.com/2',
    },
    {
      name: 'Google Drive',
      authEndpoint: 'https://oauth2.googleapis.com/token',
      clientId: 'your-google-client-id',
      clientSecret: 'your-google-client-secret',
      redirectUri: 'https://yourapp.com/callback/google-drive',
      apiBaseUrl: 'https://www.googleapis.com/drive/v3',
    },
    {
      name: 'OneDrive',
      authEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      clientId: 'your-onedrive-client-id',
      clientSecret: 'your-onedrive-client-secret',
      redirectUri: 'https://yourapp.com/callback/onedrive',
      apiBaseUrl: 'https://graph.microsoft.com/v1.0',
    },
    {
      name: 'Box',
      authEndpoint: 'https://api.box.com/oauth2/token',
      clientId: 'your-box-client-id',
      clientSecret: 'your-box-client-secret',
      redirectUri: 'https://yourapp.com/callback/box',
      apiBaseUrl: 'https://api.box.com/2.0',
    },
    {
      name: 'Amazon S3',
      authEndpoint: null,
      clientId: null,
      clientSecret: null,
      redirectUri: null,
      apiBaseUrl: 'https://s3.amazonaws.com',
    },
    {
      name: 'Backblaze B2',
      authEndpoint: 'https://api.backblazeb2.com/b2api/v2/b2_authorize_account',
      clientId: 'your-backblaze-account-id',
      clientSecret: 'your-backblaze-application-key',
      redirectUri: null,
      apiBaseUrl: 'https://api.backblazeb2.com',
    },
    {
      name: 'Wasabi',
      authEndpoint: null,
      clientId: null,
      clientSecret: null,
      redirectUri: null,
      apiBaseUrl: 'https://s3.wasabisys.com',
    },
    {
      name: 'pCloud',
      authEndpoint: 'https://my.pcloud.com/oauth2_token',
      clientId: 'your-pcloud-client-id',
      clientSecret: 'your-pcloud-client-secret',
      redirectUri: 'https://yourapp.com/callback/pcloud',
      apiBaseUrl: 'https://api.pcloud.com',
    },
    {
      name: 'MEGA',
      authEndpoint: null,
      clientId: null,
      clientSecret: null,
      redirectUri: null,
      apiBaseUrl: null,
    },
    {
      name: 'IBM Cloud Object Storage',
      authEndpoint: null,
      clientId: 'your-ibm-api-key',
      clientSecret: null,
      redirectUri: null,
      apiBaseUrl: 'https://s3.us.cloud-object-storage.appdomain.cloud',
    },
    {
      name: 'Alibaba Cloud OSS',
      authEndpoint: null,
      clientId: null,
      clientSecret: null,
      redirectUri: null,
      apiBaseUrl: 'https://oss-cn-hangzhou.aliyuncs.com',
    },
    {
      name: 'Linode Object Storage',
      authEndpoint: null,
      clientId: null,
      clientSecret: null,
      redirectUri: null,
      apiBaseUrl: 'https://us-east-1.linodeobjects.com',
    },
    {
      name: 'Oracle Cloud Storage',
      authEndpoint: null,
      clientId: null,
      clientSecret: null,
      redirectUri: null,
      apiBaseUrl: 'https://objectstorage.us-phoenix-1.oraclecloud.com',
    },
    {
      name: 'Scaleway',
      authEndpoint: null,
      clientId: null,
      clientSecret: null,
      redirectUri: null,
      apiBaseUrl: 'https://s3.fr-par.scw.cloud',
    },
    {
      name: 'OpenDrive',
      authEndpoint: 'https://dev.opendrive.com/api/v1/session/login.json',
      clientId: null,
      clientSecret: null,
      redirectUri: null,
      apiBaseUrl: 'https://dev.opendrive.com/api/v1',
    },
    {
      name: 'Citrix ShareFile',
      authEndpoint: 'https://secure.sf-api.com/oauth/token',
      clientId: 'your-sharefile-client-id',
      clientSecret: 'your-sharefile-client-secret',
      redirectUri: 'https://yourapp.com/callback/sharefile',
      apiBaseUrl: 'https://secure.sf-api.com',
    },
    {
      name: 'Yandex Disk',
      authEndpoint: 'https://oauth.yandex.com/token',
      clientId: 'your-yandex-client-id',
      clientSecret: 'your-yandex-client-secret',
      redirectUri: 'https://yourapp.com/callback/yandex-disk',
      apiBaseUrl: 'https://cloud-api.yandex.net/v1/disk',
    },
    {
      name: 'HubiC',
      authEndpoint: 'https://api.hubic.com/oauth/token',
      clientId: 'your-hubic-client-id',
      clientSecret: 'your-hubic-client-secret',
      redirectUri: 'https://yourapp.com/callback/hubic',
      apiBaseUrl: 'https://api.hubic.com/1.0',
    },
    // Add other integrations here
  ];

  // Insert integrations into the database
  for (const integration of integrations) {
    try {
      const existing = await UserRepository.findOne({ name: integration.name });
      if (!existing) {
        await UserRepository.create(integration);
        console.log(`Preloaded integration: ${integration.name}`);
      } else {
        console.log(`Integration already exists: ${integration.name}`);
      }
    } catch (err) {
      console.error(`Failed to preload integration ${integration.name}:`, err.message);
    }
  }
};

export default preloadIntegrations;
