// /frontend/src/config/awsConfig.js
import { useSecrets } from "../components/SecretsFetcher";

/**
 * ✅ Hook-Based AWS Config
 * Dynamically reads secrets loaded from SecretsFetcher context.
 */
const useAwsConfig = () => {
  const secrets = useSecrets();

  return {
    aws_project_region: secrets?.VITE_AWS_REGION || "us-east-1",
    Auth: {
      region: secrets?.VITE_AWS_REGION || "us-east-1",
      userPoolId: secrets?.VITE_COGNITO_USER_POOL_ID || "us-east-1_defaultPoolId",
      userPoolWebClientId: secrets?.VITE_COGNITO_CLIENT_ID || "defaultClientId",
      mandatorySignIn: true,
      authenticationFlowType: "USER_PASSWORD_AUTH",
    },
    Storage: {
      bucket: secrets?.VITE_S3_BUCKET || "default-bucket",
      region: secrets?.VITE_AWS_REGION || "us-east-1",
    },
  };
};

export default useAwsConfig;
