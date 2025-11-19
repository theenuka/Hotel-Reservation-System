import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Layout from "./layouts/Layout";
import ScrollToTop from "./components/ScrollToTop";
import { Toaster } from "./components/ui/toaster";
import AddHotel from "./pages/AddHotel";
import MyHotels from "./pages/MyHotels";
import EditHotel from "./pages/EditHotel";
import Search from "./pages/Search";
import Detail from "./pages/Detail";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import Home from "./pages/Home";
import ApiDocs from "./pages/ApiDocs";
import ApiStatus from "./pages/ApiStatus";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import useAppContext from "./hooks/useAppContext";

const App = () => {
  const { isLoggedIn, userRoles } = useAppContext();
  const roleSet = new Set(userRoles);
  const canManageHotels = roleSet.has("hotel_owner") || roleSet.has("admin");
  const canViewAnalytics = canManageHotels || roleSet.has("admin");

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/search"
          element={
            <Layout>
              <Search />
            </Layout>
          }
        />
        <Route
          path="/detail/:hotelId"
          element={
            <Layout>
              <Detail />
            </Layout>
          }
        />
        <Route
          path="/api-docs"
          element={
            <Layout>
              <ApiDocs />
            </Layout>
          }
        />
        <Route
          path="/api-status"
          element={
            <Layout>
              <ApiStatus />
            </Layout>
          }
        />
        <Route
          path="/analytics"
          element={
            isLoggedIn && canViewAnalytics ? (
              <Layout>
                <AnalyticsDashboard />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        
        {/* Protected Routes - Only accessible if logged in via Asgardeo */}
        {isLoggedIn && (
          <>
            <Route
              path="/hotel/:hotelId/booking"
              element={
                <Layout>
                  <Booking />
                </Layout>
              }
            />
            {canManageHotels && (
              <>
                <Route
                  path="/add-hotel"
                  element={
                    <Layout>
                      <AddHotel />
                    </Layout>
                  }
                />
                <Route
                  path="/edit-hotel/:hotelId"
                  element={
                    <Layout>
                      <EditHotel />
                    </Layout>
                  }
                />
                <Route
                  path="/my-hotels"
                  element={
                    <Layout>
                      <MyHotels />
                    </Layout>
                  }
                />
              </>
            )}
            <Route
              path="/my-bookings"
              element={
                <Layout>
                  <MyBookings />
                </Layout>
              }
            />
          </>
        )}
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
    </Router>
  );
};

export default App;