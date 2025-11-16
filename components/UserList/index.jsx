import React from 'react';
import { Divider, List, ListItem, ListItemText, Typography, Box, } from '@mui/material';
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { fetchUserList, fetchUserListCounts } from '../../api';
import useAdvancedStore from "../../store/useAdvancedStore";

import './styles.css';

function UserList() {
  const navigate = useNavigate();
  const advancedMode = useAdvancedStore((s) => s.advancedMode);

  // Get user list
  const { data: usersData, userListIsLoading, userListIsError } = useQuery({
    queryKey: ['user list'],
    queryFn: () => fetchUserList(),
  });
  if (userListIsLoading) return <p>Loading user list...</p>;  
  if (userListIsError) return <p>Error loading user list</p>;

  // Get user picture/comment counts
  const { data: counts, countIsLoading, countIsError } = useQuery({
    queryKey: ['user list counts'],
    queryFn: () => fetchUserListCounts(),
  });
  if (countIsLoading) return <p>Loading counts...</p>;  
  if (countIsError) return <p>Error loading user counts</p>;

  // Match users with counts
  let users = [];
  if (usersData && counts) {
    users = usersData.map((u) => {
      const match = counts.find((c) => c._id === u._id);
      return match ? { ...u, photoCount: match.photoCount, commentCount: match.commentCount } : u;
    });
  }

  const handleCommentClick = (userId) => {
    navigate(`/comments/${userId}`);
  };
  
  return (
    <div className="user-list">
      <Typography variant="h4">
        Users
      </Typography>

      <List component="nav">
        {users.map((user) => (
          <React.Fragment key={user._id}>
            <ListItem sx={{color: "inherit",}}>
              <ListItemText primary={(
                <Link
                  to={`/users/${user._id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "lightgray"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {user.first_name} {user.last_name}
                </Link>
              )}/>
              {advancedMode && (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: "green", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                    {user.photoCount}
                  </Box>
                  <Box sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: "red", display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer" }}
                    onClick={() => {handleCommentClick(user._id);}}
                  >
                    {user.commentCount}
                  </Box>
                </Box>
              )}
            </ListItem>
            <Divider />
          </React.Fragment>
          
        ))}
      </List>
    </div>
  );
}

export default UserList;
