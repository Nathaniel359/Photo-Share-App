import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Card, CardMedia, CardContent, Grid } from "@mui/material";
import { useQuery } from '@tanstack/react-query';
import { fetchUserName, fetchComments, fetchPhotosOfUser } from "../../api";
import { useQueryClient } from '@tanstack/react-query';

function UserComments() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    title = `Comments of ${user.first_name} ${user.last_name}`;
  }

  // Get comments of user
  const { data: comments, commentsIsLoading, commentsIsError } = useQuery({
    queryKey: ['comments', userId],
    queryFn: () => fetchComments(userId),
    enabled: !!userId
  });
  if (commentsIsLoading) return <p>Loading comments...</p>;  
  if (commentsIsError) return <p>Error loading comments</p>;
  if (!comments) return null;

  // Navigate to photo from comment
  const handleClickComment = async (comment) => {
    const data = await queryClient.fetchQuery({
      queryKey: ['photos', comment.photoUserId],
      queryFn: () => fetchPhotosOfUser(comment.photoUserId)
    });

    const index = data.findIndex(p => p.file_name === comment.file_name);
    navigate(`/photos/${comment.photoUserId}/${index + 1}`);
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>{title}</Typography>
      <Grid container spacing={2}>
        {comments.map((c) => (
          <Grid item key={c.commentId} xs={12} sm={6} md={4}>
            <Card
              sx={{ display: "flex", cursor: "pointer" }}
              onClick={() => handleClickComment(c)}
            >
              <CardMedia
                component="img"
                sx={{ width: 100 }}
                image={`/images/${c.file_name}`}
                alt="Photo thumbnail"
              />
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="body2">{c.comment}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default UserComments;