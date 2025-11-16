import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Typography, Grid, Card, CardMedia, CardContent, CardHeader, Divider, Button, TextField, Box } from "@mui/material";
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { fetchUserName, fetchPhotosOfUser, addComment } from "../../api";
import useAdvancedStore from "../../store/useAdvancedStore";

import "./styles.css";

function UserPhotos() {
  const { userId, photoIndex } = useParams();
  const currentIndex = photoIndex ? parseInt(photoIndex, 10) - 1 : 0; // index for the stepper
  const navigate = useNavigate();
  const advancedMode = useAdvancedStore((s) => s.advancedMode);
  const setAdvancedMode = useAdvancedStore((s) => s.setAdvancedMode);
  const queryClient = useQueryClient();

  // State for adding comments
  const [newComment, setNewComment] = useState({});

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

  // regular view
  if (!advancedMode) {
    return (
      <div className="user-photos">
        <Typography variant="h2">
          Photos of {userName}
        </Typography>

        <Grid container spacing={1}>
          {photos.map((photo) => (
            <Grid item xs={10} key={photo._id}>
              <Card>
                <CardHeader
                  title={`Uploaded: ${new Date(photo.date_time).toLocaleString()}`}
                />
                <CardMedia
                  component="img"
                  image={`/images/${photo.file_name}`}
                  alt="User photo"
                />
                <CardContent>
                  <Typography variant="body1">Comments:</Typography>
                  {(photo.comments || []).length === 0 && (
                    <Typography variant="body2">No comments yet.</Typography>
                  )}

                  {(photo.comments || []).map((comment) => (
                    <div key={comment._id} style={{ marginBottom: "10px" }}>
                      <Typography variant="body2">
                        <Link to={`/users/${comment.user._id}`}>
                          {comment.user.first_name} {comment.user.last_name}
                        </Link>{" "}
                        ({new Date(comment.date_time).toLocaleString()}): {comment.comment}
                      </Typography>
                      <Divider />
                    </div>
                  ))}

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
          ))}
        </Grid>
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

  return (
    <div className="user-photos">
      <Typography variant="h2">
        Photos of {userName}
      </Typography>

      <Card>
        <CardHeader 
          title={`Uploaded: ${new Date(photo.date_time).toLocaleString()}`} 
        />
        <CardMedia
          component="img"
          image={`/images/${photo.file_name}`}
          alt="User photo"
        />
        <CardContent>
          <Typography variant="body1">Comments:</Typography>
          {(photo.comments || []).length === 0 && (
            <Typography variant="body2">No comments yet.</Typography>
          )}
          {(photo.comments || []).map((comment) => (
            <div key={comment._id} style={{ marginBottom: "10px" }}>
              <Typography variant="body2">
                <Link to={`/users/${comment.user._id}`}>
                  {comment.user.first_name} {comment.user.last_name}
                </Link>{" "}
                ({new Date(comment.date_time).toLocaleString()}): {comment.comment}
              </Typography>
              <Divider />
            </div>
          ))}

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
    </div>
  );
}

export default UserPhotos;