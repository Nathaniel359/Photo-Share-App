import { Typography, Card, CardContent, Link as MuiLink, Button } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { fetchUserName } from "../../api";
import useAdvancedStore from "../../store/useAdvancedStore"

import './styles.css';

function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const advancedMode = useAdvancedStore((s) => s.advancedMode);
  
  // Get user
  const { data: user, userIsLoading, userIsError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserName(userId),
    enabled: !!userId
  });
  if (userIsLoading) return <p>Loading...</p>;  
  if (userIsError) return <p>Error loading user</p>;

  // URL depends on whether advancedMode is enabled or not when navigating to photos
  const handleClickPhotos = () => {
    if (advancedMode) {
      navigate(`/photos/${user._id}/1`);
    } else {
      navigate(`/photos/${user._id}`);
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h4" >
          {user.first_name} {user.last_name}
        </Typography>
        <Typography variant="body1">
          Location: {user.location}
        </Typography>
        <Typography variant="body1">
          Occupation: {user.occupation}
        </Typography>
        <Typography variant="body1">
          {user.description}
        </Typography>
        <MuiLink component={Button} onClick={handleClickPhotos}>
          Photos
        </MuiLink>
      </CardContent>
    </Card>
  );
}

export default UserDetail;