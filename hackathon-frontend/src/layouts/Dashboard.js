import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Box, Button, Card, CssBaseline } from '@mui/material';
import { ToastContainer } from "react-toastify";
import routes from "./../routes.js";
import { apiCheckLogin } from "../api/auth.js";
import { NEEDS_UPDATE_STRING, showErrorToast } from "../utils/utilFunctions.js";
import { apiGetUserRights } from "../api/rights.js";
import LoadingBar from "react-top-loading-bar";

const Dashboard = () => {
  const navigate = useNavigate(); // Initialize navigate function
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  const [rights, setRights] = useState([])
  const [userRights, setUserRights] = useState([])

  const [progress, setProgress] = useState(0)


  useEffect(() => {


    apiGetUserRights((userRights) => {
      if (userRights) {
        setUserRights(userRights)

      }
    })

  }, [])


  useEffect(() => {
    document.body.classList.add("bg-gray-300");
    updateData();
    if (window.innerWidth >= 900) {
      setSidebarOpen(true);
    }

    // Add an event listener for the custom event
    window.addEventListener('loadingProgress', (event) => {
      setProgress(event.detail.progress)
    });

    return () => {
      document.body.classList.remove("bg-gray-300");
    };


  }, [])

  const updateData = async (needsUpdate) => {
    if (needsUpdate) {
      if (needsUpdate === NEEDS_UPDATE_STRING.user) {
        checkLogin()
        apiGetUserRights(setUserRights)
      }
    } else {
      await checkLogin()

      apiGetUserRights(setUserRights)

    }
  }

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const checkLogin = async () => {
    await apiCheckLogin(navigateToAuth, setUser)
  }

  const navigateToAuth = () => {
    navigate('/auth')

  }

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/dashboard") {
        const Component = prop.component;
        return (
          <Route key={`route_${prop.id}`} path={prop.path} element={
            <Component
              user={user}
              updateData={updateData}
              rights={rights}
              userRights={userRights}
            />
          } exact />
        );
      } else {
        return null;
      }
    });
  };

  return (
    <>
      <LoadingBar
        color='#f11946'
        progress={progress}
        onLoaderFinished={() => setProgress(0)}
      />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <CssBaseline />

        {/* Sidebar */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}
          user={user}
          userRights={userRights}
          rights={rights}
        />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.grey',
            p: 3,
            ml: 0, // Offset for the sidebar on desktop
            mt: 8 // Offset for the navbar
          }}
        >
          <Navbar user={user} onMenuClick={handleMenuClick} userRights={userRights} />
          <Box className="pb-6">
            <Card className="p-3">
              <Routes>
                {getRoutes(routes)}
                <Route path="*" element={<Navigate to="/dashboard/index" replace />} />
              </Routes>
            </Card>
          </Box>
        </Box>
      </Box>

      <ToastContainer
        position="top-right"
        autoClose={5000} // Adjust the duration for which the toast should be visible
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
};

export default Dashboard;
