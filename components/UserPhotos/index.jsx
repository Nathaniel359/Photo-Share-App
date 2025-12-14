import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Typography, Grid, Card, CardMedia, CardContent, CardHeader, Divider, Button, TextField, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Favorite, FavoriteBorder, Delete } from "@mui/icons-material";
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { fetchUserName, fetchPhotosOfUser, addComment, likePhoto, unlikePhoto, deletePhoto, deleteComment } from "../../api";
import useAdvancedStore from "../../store/useAdvancedStore";
import useAuthStore from "../../store/useAuthStore";

import "./styles.css";

function UserPhotos() {
  const { userId, photoIndex } = useParams();
  const currentIndex = photoIndex ? parseInt(photoIndex, 10) - 1 : 0; // index for the stepper
  const navigate = useNavigate();
  const advancedMode = useAdvancedStore((s) => s.advancedMode);
  const setAdvancedMode = useAdvancedStore((s) => s.setAdvancedMode);
  const loggedInUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // State for adding comments
  const [newComment, setNewComment] = useState({});
  // State for delete photo dialog
  const [deletePhotoDialog, setDeletePhotoDialog] = useState({ open: false, photoId: null });

  // Comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ photoId, commentText }) => addComment(photoId, commentText),
    onSuccess: (data, variables) => {
      // Clear the input for this photo
      setNewComment((prev) => ({ ...prev, [variables.photoId]: '' }));

      // Invalidate photos query to refetch with new comment
      queryClient.invalidateQueries(['photos', userId]);
      // Also invalidate user counts to update comment count
      queryClient.invalidateQueries(['users', 'counts']);
    },
    onError: (error) => {
      console.error('Failed to add comment:', error);
    },
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: (photoId) => likePhoto(photoId),
    onSuccess: (data, photoId) => {
      // Optimistically update the like count without refetching
      queryClient.setQueryData(['photos', userId], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(photo =>
          photo._id === photoId
            ? { ...photo, likes: [...(photo.likes || []), loggedInUser._id] }
            : photo
        );
      });
    },
  });

  // Unlike mutation
  const unlikeMutation = useMutation({
    mutationFn: (photoId) => unlikePhoto(photoId),
    onSuccess: (data, photoId) => {
      // Optimistically update the like count without refetching
      queryClient.setQueryData(['photos', userId], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(photo =>
          photo._id === photoId
            ? { ...photo, likes: (photo.likes || []).filter(id => id !== loggedInUser._id) }
            : photo
        );
      });
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: (photoId) => deletePhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries(['photos', userId]);
      queryClient.invalidateQueries(['users', 'counts']);
      setDeletePhotoDialog({ open: false, photoId: null });
      // If in advanced mode and this was the last photo, navigate back
      // eslint-disable-next-line no-use-before-define
      if (advancedMode && photos && photos.length === 1) {
        navigate(`/users/${userId}`);
      }
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: ({ photoId, commentId }) => deleteComment(photoId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['photos', userId]);
      queryClient.invalidateQueries(['users', 'counts']);
    },
  });

  useEffect(() => {
    if (photoIndex && !advancedMode) {
      setAdvancedMode(true);
    }
  }, [photoIndex, advancedMode, setAdvancedMode]);

  // Get user
  const { data: user, userIsLoading, userIsError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserName(userId),
    enabled: !!userId
  });
  if (userIsLoading) return <p>Loading user...</p>;  
  if (userIsError) return <p>Error loading user</p>;

  let userName = '';
  if (user) {
    userName = `${user.first_name} ${user.last_name}`;
  }

  // Get user photos
  const { data: photos, photosIsLoading, photosIsError } = useQuery({
    queryKey: ['photos', userId],
    queryFn: () => fetchPhotosOfUser(userId),
    enabled: !!userId
  });
  if (photosIsLoading) return <p>Loading photos...</p>;  
  if (photosIsError) return <p>Error loading photos</p>;

  if (!photos) return null;

  // Handle adding a comment
  const handleAddComment = (photoId) => {
    const commentText = newComment[photoId];
    if (!commentText || !commentText.trim()) {
      return;
    }

    addCommentMutation.mutate({ photoId, commentText });
  };

  // Helper to check if a specific photo's comment is being submitted
  const isSubmitting = (photoId) => {
    return addCommentMutation.isPending && addCommentMutation.variables?.photoId === photoId;
  };

  // Handle like/unlike toggle
  const handleLikeToggle = (photo) => {
    if (!loggedInUser) return;

    const hasLiked = photo.likes?.includes(loggedInUser._id);
    if (hasLiked) {
      unlikeMutation.mutate(photo._id);
    } else {
      likeMutation.mutate(photo._id);
    }
  };

  // Handle delete photo
  const handleDeletePhoto = (photoId) => {
    setDeletePhotoDialog({ open: true, photoId });
  };

  const confirmDeletePhoto = () => {
    if (deletePhotoDialog.photoId) {
      deletePhotoMutation.mutate(deletePhotoDialog.photoId);
    }
  };

  // Handle delete comment
  const handleDeleteComment = (photoId, commentId) => {
    deleteCommentMutation.mutate({ photoId, commentId });
  };

  // regular view
  if (!advancedMode) {
    return (
      <div className="user-photos">
        <Typography variant="h2">
          Photos of {userName}
        </Typography>

        <Grid container spacing={1}>
          {photos.map((photo) => {
            const hasLiked = photo.likes?.includes(loggedInUser?._id);
            const likeCount = photo.likes?.length || 0;
            const isOwner = loggedInUser?._id === photo.user_id;

            return (
              <Grid item xs={10} key={photo._id}>
                <Card>
                  <CardHeader
                    title={`Uploaded: ${new Date(photo.date_time).toLocaleString()}`}
                    action={
                      isOwner && (
                        <IconButton
                          aria-label="delete photo"
                          onClick={() => handleDeletePhoto(photo._id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      )
                    }
                  />
                  <CardMedia
                    component="img"
                    image={`/images/${photo.file_name}`}
                    alt="User photo"
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <IconButton
                        onClick={() => handleLikeToggle(photo)}
                        color="error"
                        disabled={likeMutation.isPending || unlikeMutation.isPending}
                      >
                        {hasLiked ? <Favorite /> : <FavoriteBorder />}
                      </IconButton>
                      <Typography variant="body2">
                        {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                      </Typography>
                    </Box>
                  <Typography variant="body1">Comments:</Typography>
                  {(photo.comments || []).length === 0 && (
                    <Typography variant="body2">No comments yet.</Typography>
                  )}

                  {(photo.comments || []).map((comment) => {
                    const isCommentOwner = loggedInUser?._id === comment.user._id;
                    return (
                      <Box key={comment._id} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          <Link to={`/users/${comment.user._id}`}>
                            {comment.user.first_name} {comment.user.last_name}
                          </Link>{" "}
                          ({new Date(comment.date_time).toLocaleString()}): {comment.comment}
                        </Typography>
                        {isCommentOwner && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteComment(photo._id, comment._id)}
                            disabled={deleteCommentMutation.isPending}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                        <Divider />
                      </Box>
                    );
                  })}

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>Add a comment:</Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Write your comment here..."
                      value={newComment[photo._id] || ''}
                      onChange={(e) => setNewComment({ ...newComment, [photo._id]: e.target.value })}
                      disabled={isSubmitting(photo._id)}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleAddComment(photo._id)}
                      disabled={isSubmitting(photo._id) || !newComment[photo._id]?.trim()}
                      sx={{ mt: 1 }}
                    >
                      {isSubmitting(photo._id) ? 'Adding...' : 'Add Comment'}
                    </Button>
                  </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Delete Photo Confirmation Dialog */}
        <Dialog open={deletePhotoDialog.open} onClose={() => setDeletePhotoDialog({ open: false, photoId: null })}>
          <DialogTitle>Delete Photo?</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this photo? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeletePhotoDialog({ open: false, photoId: null })}>Cancel</Button>
            <Button onClick={confirmDeletePhoto} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  // advanced view (stepper)
  const goToIndex = (index) => {
    if (index < 0 || index >= photos.length) return;
    navigate(`/photos/${userId}/${index + 1}`, { replace: false });
  };

  let photo = null;
  if (photos) {
    photo = photos[currentIndex];
  }
  if (!photo) return null;

  const hasLiked = photo.likes?.includes(loggedInUser?._id);
  const likeCount = photo.likes?.length || 0;
  const isOwner = loggedInUser?._id === photo.user_id;

  return (
    <div className="user-photos">
      <Typography variant="h2">
        Photos of {userName}
      </Typography>

      <Card>
        <CardHeader
          title={`Uploaded: ${new Date(photo.date_time).toLocaleString()}`}
          action={
            isOwner && (
              <IconButton
                aria-label="delete photo"
                onClick={() => handleDeletePhoto(photo._id)}
                color="error"
              >
                <Delete />
              </IconButton>
            )
          }
        />
        <CardMedia
          component="img"
          image={`/images/${photo.file_name}`}
          alt="User photo"
        />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton
              onClick={() => handleLikeToggle(photo)}
              color="error"
              disabled={likeMutation.isPending || unlikeMutation.isPending}
            >
              {hasLiked ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
            <Typography variant="body2">
              {likeCount} {likeCount === 1 ? 'like' : 'likes'}
            </Typography>
          </Box>
          <Typography variant="body1">Comments:</Typography>
          {(photo.comments || []).length === 0 && (
            <Typography variant="body2">No comments yet.</Typography>
          )}
          {(photo.comments || []).map((comment) => {
            const isCommentOwner = loggedInUser?._id === comment.user._id;
            return (
              <Box key={comment._id} sx={{ mb: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  <Link to={`/users/${comment.user._id}`}>
                    {comment.user.first_name} {comment.user.last_name}
                  </Link>{" "}
                  ({new Date(comment.date_time).toLocaleString()}): {comment.comment}
                </Typography>
                {isCommentOwner && (
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteComment(photo._id, comment._id)}
                    disabled={deleteCommentMutation.isPending}
                    color="error"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
                <Divider />
              </Box>
            );
          })}

          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>Add a comment:</Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Write your comment here..."
              value={newComment[photo._id] || ''}
              onChange={(e) => setNewComment({ ...newComment, [photo._id]: e.target.value })}
              disabled={isSubmitting(photo._id)}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleAddComment(photo._id)}
              disabled={isSubmitting(photo._id) || !newComment[photo._id]?.trim()}
              sx={{ mt: 1 }}
            >
              {isSubmitting(photo._id) ? 'Adding...' : 'Add Comment'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between" }}>
        <Button
          onClick={() => goToIndex(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>
        <Typography>
          {currentIndex + 1} / {photos.length}
        </Typography>
        <Button
          onClick={() => goToIndex(currentIndex + 1)}
          disabled={currentIndex === photos.length - 1}
        >
          Next
        </Button>
      </div>

      {/* Delete Photo Confirmation Dialog */}
      <Dialog open={deletePhotoDialog.open} onClose={() => setDeletePhotoDialog({ open: false, photoId: null })}>
        <DialogTitle>Delete Photo?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this photo? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePhotoDialog({ open: false, photoId: null })}>Cancel</Button>
          <Button onClick={confirmDeletePhoto} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default UserPhotos;