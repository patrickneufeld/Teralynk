import { useEffect } from "react";
import { useRouter } from "next/router";

const OAuthCallback = () => {
  const router = useRouter();
  const { code, repo } = router.query;

  useEffect(() => {
    if (code && repo) {
      const fetchAccessToken = async () => {
        try {
          const response = await fetch(`/api/oauth/auth/${repo}/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ authCode: code }),
          });

          const data = await response.json();
          if (response.ok) {
            console.log("Access Token:", data.access_token);
          } else {
            console.error("Error:", data.error);
          }
        } catch (error) {
          console.error("Error fetching access token:", error);
        }
      };

      fetchAccessToken();
    }
  }, [code, repo]);

  return <h1>Processing OAuth Callback...</h1>;
};

export default OAuthCallback;
