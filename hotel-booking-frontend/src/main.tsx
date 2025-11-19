import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "react-query";
import { AppContextProvider } from "./contexts/AppContext.tsx";
import { SearchContextProvider } from "./contexts/SearchContext.tsx";
// 1. Import Asgardeo SDK
import { AuthProvider } from "@asgardeo/auth-react";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
    },
  },
});

// 2. Define the Asgardeo Configuration
// We use the keys from your screenshot and your ALB URL
const authConfig = {
    signInRedirectURL: "http://phoenix-alb-1908878835.us-east-1.elb.amazonaws.com",
    signOutRedirectURL: "http://phoenix-alb-1908878835.us-east-1.elb.amazonaws.com",
    clientID: "iYcA_MO8LwTND_hvunAg8VvBHDua",
    baseUrl: "https://api.asgardeo.io/t/theenukagranex",
    scope: [ "openid", "profile" ]
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* 3. Wrap the whole app with AuthProvider */}
    <AuthProvider config={ authConfig }>
      <QueryClientProvider client={queryClient}>
        <AppContextProvider>
          <SearchContextProvider>
            <App />
          </SearchContextProvider>
        </AppContextProvider>
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>
);