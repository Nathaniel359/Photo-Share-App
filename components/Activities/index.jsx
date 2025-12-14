import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import io from "socket.io-client";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  CircularProgress
} from "@mui/material";
import { fetchActivities } from "../../api";

/* Format activity type */
function formatActivityText(activity) {
  switch (activity.type) {
    case "PHOTO_UPLOAD":
      return "Uploaded a new photo";
    case "COMMENT":
      return "Left a new comment";
    case "USER_REGISTER":
      return "Registered an account";
    case "USER_LOGIN":
      return "Logged in";
    case "USER_LOGOUT":
      return "Logged out";
    default:
      return activity.type;
  }
}

function Activities() {
  const queryClient = useQueryClient();

  // Fetch activities
  const { data, isLoading, error } = useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities,
  });

  // Real-time updates
  useEffect(() => {
    const socket = io("http://localhost:3001");
    
    socket.on("newActivity", (activity) => {
      queryClient.setQueryData(["activities"], (old = []) => [activity, ...old.slice(0, 4)]);
    });

    return () => {
      socket.off("newActivity");
    };
  }, [queryClient]);

  if (isLoading) return <CircularProgress />;
  if (error) return <Typography>Error loading activities</Typography>;

  return (
    <Box sx={{ maxWidth: 600, margin: "0 auto", mt: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Recent Activities
      </Typography>

      {data.length === 0 && (
        <Typography>No recent activities.</Typography>
      )}

      {data.map((activity) => (
        <Card key={activity._id} sx={{ mb: 2 }}>
          <CardContent sx={{ display: "flex", gap: 2 }}>
            {/* Avatar */}
            <Avatar>
              {activity.user_id?.first_name?.[0] || "?"}
            </Avatar>

            <Box sx={{ flexGrow: 1 }}>
              {/* User name */}
              <Typography variant="subtitle1">
                {activity.user_id?.first_name} {activity.user_id?.last_name}
              </Typography>

              {/* Activity type */}
              <Typography variant="body2" color="text.secondary">
                {formatActivityText(activity)}
              </Typography>

              {/* Thumbnail (optional) */}
              {activity.photo_id && (
                <Box sx={{ mt: 1 }}>
                  <img
                    src={`/images/${activity.photo_id.file_name}`}
                    alt="thumbnail"
                    style={{ width: 80, height: "auto", borderRadius: 6 }}
                  />
                </Box>
              )}

              {/* Timestamp */}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                {new Date(activity.created_at).toLocaleString()}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default Activities;