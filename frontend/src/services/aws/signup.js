// File: /frontend/src/services/aws/signup.js

import {
    CognitoIdentityProviderClient,
    SignUpCommand,
    ConfirmSignUpCommand,
    ResendConfirmationCodeCommand,
  } from "@aws-sdk/client-cognito-identity-provider";
  import { getCognitoConfig } from "./config";
  import { logInfo, logError } from "../../utils/logging/logging";
  
  /**
   * Returns a new Cognito client
   */
  const getClient = () => {
    const { region } = getCognitoConfig();
    return new CognitoIdentityProviderClient({ region });
  };
  
  /**
   * Signs up a new user to Cognito User Pool.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} Cognito response
   */
  export const signupUser = async (email, password) => {
    const { clientId } = getCognitoConfig();
    const client = getClient();
  
    const command = new SignUpCommand({
      ClientId: clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
      ],
    });
  
    try {
      const response = await client.send(command);
      logInfo("✅ Signup initiated", response);
      return response;
    } catch (err) {
      logError("❌ Signup failed", err);
      throw new Error(err.message || "Signup failed. Please try again.");
    }
  };
  
  /**
   * Confirms a user's signup using a verification code.
   *
   * @param {string} email
   * @param {string} code
   * @returns {Promise<Object>}
   */
  export const confirmSignup = async (email, code) => {
    const { clientId } = getCognitoConfig();
    const client = getClient();
  
    const command = new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: email,
      ConfirmationCode: code,
    });
  
    try {
      const response = await client.send(command);
      logInfo("✅ Signup confirmed", response);
      return response;
    } catch (err) {
      logError("❌ Confirm signup failed", err);
      throw new Error(err.message || "Confirmation failed. Please try again.");
    }
  };
  
  /**
   * Resends a confirmation code to the user's email.
   *
   * @param {string} email
   * @returns {Promise<Object>}
   */
  export const resendConfirmationCode = async (email) => {
    const { clientId } = getCognitoConfig();
    const client = getClient();
  
    const command = new ResendConfirmationCodeCommand({
      ClientId: clientId,
      Username: email,
    });
  
    try {
      const response = await client.send(command);
      logInfo("📩 Confirmation code resent", response);
      return response;
    } catch (err) {
      logError("❌ Failed to resend confirmation code", err);
      throw new Error(err.message || "Failed to resend code. Please try again.");
    }
  };
  