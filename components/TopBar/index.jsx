import React, { useState } from "react";
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
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { fetchUserName, logoutUser, uploadPhoto, fetchUserList } from "../../api";
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
  const [sharingList, setSharingList] = useState(null);

  const { data: userList } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: fetchUserList,
    enabled: !!loggedInUser,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      clearUser();
      navigate('/login');
    },
    onError: () => {
      // Even if the server call fails, clear local state
      clearUser();
      navigate('/login');
    },
  });

  // Photo upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, sharingList }) => uploadPhoto(file, sharingList),
    onSuccess: () => {
      // Invalidate photos query for the logged-in user
      if (loggedInUser) {
        queryClient.invalidateQueries(['photos', loggedInUser._id]);
        // Also invalidate user counts to update photo count
        queryClient.invalidateQueries(['users', 'counts']);
      }

      // Close dialog after a brief delay
      setTimeout(() => {
        setUploadDialogOpen(false);
        setSelectedFile(null);
        // Navigate to the user's photos page
        if (loggedInUser) {
          navigate(`/photos/${loggedInUser._id}`);
        }
      }, 1500);
    },
  });

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
    } else if (location.pathname.startsWith('/comments')) {
      title = `Comments of ${user.first_name} ${user.last_name}`;
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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
    setSelectedFile(null);
    uploadMutation.reset();
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    uploadMutation.reset();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if it's an image file
      if (!file.type.startsWith('image/')) {
        return;
      }
      setSelectedFile(file);
      uploadMutation.reset();
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      return;
    }

    uploadMutation.mutate({
      file: selectedFile,
      sharingList,
    });
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
              <Button color="inherit" variant="outlined" onClick={() => navigate('/activities')}>
                Activities
              </Button>
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
          {uploadMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to upload photo. Please try again.
            </Alert>
          )}
          {uploadMutation.isSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Photo uploaded successfully!
            </Alert>
          )}
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploadMutation.isPending}
              style={{ display: 'block', marginBottom: '1rem' }}
            />
            {selectedFile && (
              <Typography variant="body2">
                Selected: {selectedFile.name}
              </Typography>
            )}
          </Box>
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Who can see this photo?
            </Typography>

            <FormControl fullWidth>
              <RadioGroup
                value={
                  sharingList === null
                    ? "public"
                    : sharingList.length === 0
                      ? "onlyMe"
                      : "custom"
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "public") setSharingList(null);
                  else if (v === "onlyMe") setSharingList([]);
                  else if (v === "custom") setSharingList([]);
                }}
              >
                <FormControlLabel value="public" control={<Radio />} label="Public (everyone can see)" />
                <FormControlLabel value="onlyMe" control={<Radio />} label="Only Me" />
                <FormControlLabel value="custom" control={<Radio />} label="Specific users…" />
              </RadioGroup>
            </FormControl>

            {Array.isArray(sharingList) && loggedInUser && (
              <Box sx={{ ml: 2, mt: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Select users:
                </Typography>

                {userList?.map((user) => {
                  const isOwner = user._id === loggedInUser._id;
                  return (
                    <FormControlLabel
                      key={user._id}
                      control={
                        <Checkbox
                          checked={isOwner || sharingList.includes(user._id)}
                          disabled={isOwner}
                          onChange={() => {
                            setSharingList((prev) => {
                              if (prev.includes(user._id)) {
                                return prev.filter((id) => id !== user._id);
                              } else {
                                return [...prev, user._id];
                              }
                            });
                          }}
                        />
                      }
                      label={`${user.first_name} ${user.last_name}`}
                    />
                  );
                })}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={uploadMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}

export default TopBar;