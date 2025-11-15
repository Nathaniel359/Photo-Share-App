import { AppBar, Toolbar, Typography, Switch } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { fetchUserName } from "../../api";
import useAdvancedStore from "../../store/useAdvancedStore"

import "./styles.css";

function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.pathname.split('/')[2];
  const advancedMode = useAdvancedStore((s) => s.advancedMode);
  const setAdvancedMode = useAdvancedStore((s) => s.setAdvancedMode);

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

  return (
    <AppBar position="static">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h5">Nathaniel Tan</Typography>

        <Typography variant="h5">{title}</Typography>

        <label>
          Advanced Features
          <Switch
            checked={advancedMode}
            onChange={(e) => handleAdvancedModeChange(e.target.checked)}
          />
        </label>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;