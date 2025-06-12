// hooks/useRouteTracking.js
export const useRouteTracking = () => {
    const location = useLocation();
    const { user } = useAuth();
  
    useEffect(() => {
      const debounced = debounce(() => {
        if (user) {
          analytics.trackPageView({
            path: location.pathname,
            userId: user.id
          });
        }
      }, 1000);
  
      debounced();
      return () => debounced.cancel();
    }, [location.pathname, user]);
  };