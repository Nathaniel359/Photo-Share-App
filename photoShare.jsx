import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactDOM from 'react-dom/client';
import { Grid, Paper, ThemeProvider, CssBaseline } from '@mui/material';
import {
  BrowserRouter, Route, Routes, useParams,
} from 'react-router-dom';

import './styles/main.css';
import darkTheme from "./theme";

import TopBar from './components/TopBar';
import UserDetail from './components/UserDetail';
import UserList from './components/UserList';
import UserPhotos from './components/UserPhotos';
import UserComments from './components/UserComments';

function PhotoShare() {
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
            
            <Grid item sm={3}>
              <Paper className="main-grid-item">
                <UserList/>
              </Paper>
            
            </Grid>
            <Grid item sm={9}>
              <Paper className="main-grid-item">
                <Routes>
                  <Route path="/users/:userId" element={<UserDetail />} />
                  <Route path="/photos/:userId" element={<UserPhotos />} />
                  <Route path="/photos/:userId/:photoIndex" element={<UserPhotos />} />
                  <Route path="/users" element={<UserList />} />
                  <Route path="/comments/:userId" element={<UserComments />} />
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
