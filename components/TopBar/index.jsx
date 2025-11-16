import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Switch,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Box
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUserName, logoutUser, uploadPhoto } from "../../api";
import useAdvancedStore from "../../store/useAdvancedStore";
import useAuthStore from "../../store/useAuthStore";

import "./styles.css";

function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.pathname.split('/')[2];
  const advancedMode = useAdvancedStore((s) => s.advancedMode);
  const setAdvancedMode = useAdvancedStore((s) => s.setAdvancedMode);
  const loggedInUser = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const queryClient = useQueryClient();

  // Photo upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  // Get username for title
  const { data: user, userIsLoading, userIsError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserName(userId),
    enabled: !!userId
  });
  if (userIsLoading) return <p>Loading...</p>;  
  if (userIsError) return <p>Error loading user</p>;

  let title = '';
  if (user) {
    if (location.pathname.startsWith('/users/')) {
      title = `${user.first_name} ${user.last_name}`;
    } else if (location.pathname.startsWith('/photos/')) {
      title = `Photos of ${user.first_name} ${user.last_name}`;
    }
  }

  const handleAdvancedModeChange = (checked) => {
    setAdvancedMode(checked);

    // Change URL when swapping to advanced mode
    if (checked && location.pathname.includes("photos")) {
      const newPath = location.pathname + "/1";
      navigate(newPath);
    }
    // Remove photo index from URL when advanced mode disabled
    if (!checked) {
      const parts = location.pathname.split("/");
      if (parts.length > 3) {
        const newPath = `/${parts[1]}/${parts[2]}`;
        navigate(newPath);
      }
      if (location.pathname.includes("comments")) {
        const newPath = `/users/${parts[2]}`;
        navigate(newPath);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearUser();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Even if the server call fails, clear local state
      clearUser();
      navigate('/login');
    }
  };

  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
    setSelectedFile(null);
    setUploadMessage(null);
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setUploadMessage(null);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if it's an image file
      if (!file.type.startsWith('image/')) {
        setUploadMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }
      setSelectedFile(file);
      setUploadMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    setUploading(true);
    setUploadMessage(null);

    try {
      await uploadPhoto(selectedFile);
      setUploadMessage({ type: 'success', text: 'Photo uploaded successfully!' });

      // Refetch photos for the logged-in user
      if (loggedInUser) {
        await queryClient.invalidateQueries(['photos', loggedInUser._id]);
      }

      // Close dialog after a brief delay
      setTimeout(() => {
        handleCloseUploadDialog();
        // Navigate to the user's photos page
        if (loggedInUser) {
          navigate(`/photos/${loggedInUser._id}`);
        }
      }, 1500);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadMessage({ type: 'error', text: 'Failed to upload photo. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h5">Nathaniel Tan & Jichuan Li</Typography>

        <Typography variant="h5">{title}</Typography>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {loggedInUser ? (
            <>
              <Typography variant="body1">
                Hi {loggedInUser.first_name}
              </Typography>
              <Button color="inherit" variant="outlined" onClick={handleOpenUploadDialog}>
                Add Photo
              </Button>
              <Button color="inherit" variant="outlined" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Typography variant="body1">Please Login</Typography>
          )}

          <label>
            Advanced Features
            <Switch
              checked={advancedMode}
              onChange={(e) => handleAdvancedModeChange(e.target.checked)}
            />
          </label>
        </div>
      </Toolbar>

      {/* Photo Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Upload New Photo</DialogTitle>
        <DialogContent>
          {uploadMessage && (
            <Alert severity={uploadMessage.type} sx={{ mb: 2 }}>
              {uploadMessage.text}
            </Alert>
          )}
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ display: 'block', marginBottom: '1rem' }}
            />
            {selectedFile && (
              <Typography variant="body2">
                Selected: {selectedFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}

export default TopBar;