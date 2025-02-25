import UIKit
import AppAuth
import AWSMobileClient

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    // Add this to enable Cognito and OAuth flow
    var authState: OIDAuthState?

    // Define these values for Cognito
    let issuer: String = "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_7c2GCeNXR"
    let clientID: String = "6eqcef6v29pghokj0eqt7pbufv"  // Provided ClientID
    let redirectURI: String = "https://d84l1y8p4kdic.cloudfront.net"  // Your callback URL
    let logoutURL: String = "https://d84l1y8p4kdic.cloudfront.net/logout"  // Assuming the same URL for logout

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Initialize AWS MobileClient (Cognito Integration)
        AWSMobileClient.default().initialize { (userState, error) in
            if let error = error {
                print("Error initializing AWSMobileClient: \(error.localizedDescription)")
                return
            }
            print("AWSMobileClient initialized, userState: \(String(describing: userState))")
        }
        
        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
        // Handle the callback URL
        if OIDAuthState.canHandle(url) {
            OIDAuthState.authState(byPresenting: url, presenting: self.window!.rootViewController!) { (authState, error) in
                if let error = error {
                    print("Authorization error: \(error.localizedDescription)")
                    return
                }
                self.authState = authState
                print("Authorization tokens received, access token: \(authState?.lastTokenResponse?.accessToken ?? "no access token")")
            }
            return true
        }
        return false
    }

    // Function to discover OIDC configuration
    func discoverConfig() {
        guard let issuerURL = URL(string: issuer) else {
            print("Invalid issuer URL")
            return
        }

        OIDAuthorizationService.discoverConfiguration(forIssuer: issuerURL) { config, error in
            if let error = error {
                print("Error retrieving discovery document: \(error.localizedDescription)")
                return
            }

            guard let config = config else {
                print("Discovery configuration is missing")
                return
            }

            print("Discovered configuration: \(config)")
            self.buildAuthRequest(config: config)
        }
    }

    // Function to build and initiate the authentication request
    func buildAuthRequest(config: OIDServiceConfiguration) {
        let request = OIDAuthorizationRequest(
            configuration: config,
            clientId: clientID,
            scopes: [OIDScopeOpenID, OIDScopeProfile],
            redirectURL: URL(string: redirectURI)!,
            responseType: OIDResponseTypeCode,
            additionalParameters: nil
        )

        // Here you would present the authentication request
        OIDAuthState.authState(byPresenting: request, presenting: self.window!.rootViewController!) { authState, error in
            if let error = error {
                print("Authorization error: \(error.localizedDescription)")
                return
            }
            self.authState = authState
            print("Got authorization tokens: \(authState?.lastTokenResponse?.accessToken ?? "no access token")")
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Clean up any resources or tasks that need to be done on app termination.
        // If you're handling logout, this would be a good place to invalidate the session.
    }

    // This function logs out the user from Cognito
    func logoutUser() {
        guard let authState = self.authState else {
            print("No valid authentication state found.")
            return
        }

        let endSessionEndpoint = authState.lastAuthorizationResponse.request.configuration.discoveryDocument?.endSessionEndpoint

        guard let logoutURL = URL(string: endSessionEndpoint?.absoluteString ?? "") else {
            print("End session URL not found.")
            return
        }

        var components = URLComponents(url: logoutURL, resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: clientID),
            URLQueryItem(name: "logout_uri", value: logoutURL.absoluteString)
        ]

        if let finalLogoutURL = components.url {
            UIApplication.shared.open(finalLogoutURL, options: [:], completionHandler: nil)
        }
    }

    // MARK: - UISceneSession Lifecycle
    func application(_ application: UIApplication, configurationForConnecting scene: UISceneSession, options connectionOptions: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> UISceneConfiguration {
        // Configure the scene for iOS 13+ handling if necessary
        return UISceneConfiguration(name: "Default Configuration", sessionRole: scene.role)
    }

    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
        // Clean up any resources if necessary
    }
}
