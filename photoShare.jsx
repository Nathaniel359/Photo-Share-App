import React from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactDOM from 'react-dom/client';
import { Grid, Paper, ThemeProvider, CssBaseline } from '@mui/material';
import {
  BrowserRouter, Route, Routes, Navigate,
} from 'react-router-dom';

import './styles/main.css';
import darkTheme from "./theme";

import TopBar from './components/TopBar';
import UserDetail from './components/UserDetail';
import UserList from './components/UserList';
import UserPhotos from './components/UserPhotos';
import UserComments from './components/UserComments';
import LoginRegister from './components/LoginRegister';
import useAuthStore from './store/useAuthStore';

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PhotoShare() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <div>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TopBar/>
            </Grid>

            <div className="main-topbar-buffer" />

            {isAuthenticated && (
              <Grid item sm={3}>
                <Paper className="main-grid-item">
                  <UserList/>
                </Paper>
              </Grid>
            )}

            <Grid item sm={isAuthenticated ? 9 : 12}>
              <Paper className="main-grid-item">
                <Routes>
                  <Route path="/login" element={<LoginRegister />} />
                  <Route
                    path="/users/:userId"
                    element={(
                      <ProtectedRoute>
                        <UserDetail />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/photos/:userId"
                    element={(
                      <ProtectedRoute>
                        <UserPhotos />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/photos/:userId/:photoIndex"
                    element={(
                      <ProtectedRoute>
                        <UserPhotos />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/users"
                    element={(
                      <ProtectedRoute>
                        <UserList />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/comments/:userId"
                    element={(
                      <ProtectedRoute>
                        <UserComments />
                      </ProtectedRoute>
                    )}
                  />
                  <Route
                    path="/"
                    element={
                      isAuthenticated ?
                        <Navigate to="/users" replace /> :
                        <Navigate to="/login" replace />
                    }
                  />
                </Routes>
              </Paper>
            </Grid>
          </Grid>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

const queryClient = new QueryClient();
const root = ReactDOM.createRoot(document.getElementById('photoshareapp'));
root.render(
  <QueryClientProvider client={queryClient}>
    <PhotoShare />
  </QueryClientProvider>
);
