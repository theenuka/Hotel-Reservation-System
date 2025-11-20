import { useEffect } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import { useSearchParams } from "react-router-dom";

const AuthRedirect = () => {
  const { signIn, state } = useAuthContext();
  const [searchParams] = useSearchParams();
  const hasCode = searchParams.has("code");

  useEffect(() => {
    // Only initiate sign-in if we are not authenticated AND we don't have a code (callback)
    if (!state.isAuthenticated && !hasCode && !state.isLoading) {
      signIn();
    }
  }, [signIn, state.isAuthenticated, hasCode, state.isLoading]);

  if (state.error) {
    return (
      <main className="min-h-[50vh] flex flex-col items-center justify-center text-center px-6 py-24">
        <h1 className="text-2xl font-bold text-red-500">Authentication Error</h1>
        <pre className="mt-4 p-4 bg-gray-800 text-red-200 rounded text-left overflow-auto max-w-2xl">
          {JSON.stringify(state.error, null, 2)}
        </pre>
        <button 
          onClick={() => window.location.href = "/"}
          className="mt-6 px-4 py-2 bg-white text-black rounded hover:bg-gray-200"
        >
          Return Home
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-[50vh] flex flex-col items-center justify-center text-center px-6 py-24">
      <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
        {hasCode ? "Completing Sign In..." : "Redirecting to Asgardeo"}
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-white">
        {hasCode ? "Verifying your credentials..." : "Hold tight, taking you to the secure login…"}
      </h1>
      <p className="mt-3 text-base text-white/70 max-w-xl">
        If the Asgardeo login page doesn’t appear automatically, refresh the page or click the
        Sign In button in the header.
      </p>
    </main>
  );
};

export default AuthRedirect;
