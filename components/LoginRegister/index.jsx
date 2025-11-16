import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Grid,
  Divider
} from '@mui/material';
import { loginUser, registerUser } from '../../api';
import useAuthStore from '../../store/useAuthStore';

function LoginRegister() {
  // Login state
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration state
  const [regLoginName, setRegLoginName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regDescription, setRegDescription] = useState('');
  const [regOccupation, setRegOccupation] = useState('');

  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ login_name, password }) => loginUser(login_name, password),
    onSuccess: (userData) => {
      setUser(userData);
      navigate(`/users/${userData._id}`);
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: (userData) => registerUser(userData),
    onSuccess: () => {
      // Invalidate users list to include the new user
      queryClient.invalidateQueries(['users']);

      // Clear form
      setRegLoginName('');
      setRegPassword('');
      setRegPasswordConfirm('');
      setRegFirstName('');
      setRegLastName('');
      setRegLocation('');
      setRegDescription('');
      setRegOccupation('');
    },
  });

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation.reset(); // Clear previous errors

    if (!loginName.trim() || !loginPassword.trim()) {
      return;
    }

    loginMutation.mutate({
      login_name: loginName,
      password: loginPassword,
    });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    registerMutation.reset(); // Clear previous errors

    // Validation
    if (!regLoginName.trim() || !regPassword.trim() || !regPasswordConfirm.trim() ||
        !regFirstName.trim() || !regLastName.trim()) {
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      return;
    }

    registerMutation.mutate({
      login_name: regLoginName.trim(),
      password: regPassword,
      first_name: regFirstName.trim(),
      last_name: regLastName.trim(),
      location: regLocation.trim(),
      description: regDescription.trim(),
      occupation: regOccupation.trim(),
    });
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ marginTop: 4, marginBottom: 4 }}>
        <Grid container spacing={3}>
          {/* Login Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Login
                </Typography>
                {loginMutation.isError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {loginMutation.error?.response?.data || 'An error occurred during login. Please try again.'}
                  </Alert>
                )}
                <Box component="form" onSubmit={handleLogin} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="login_name"
                    label="Login Name"
                    name="login_name"
                    autoComplete="username"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? 'Logging in...' : 'Login'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Registration Section */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Register
                </Typography>
                {registerMutation.isError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {registerMutation.error?.response?.data || 'An error occurred during registration. Please try again.'}
                  </Alert>
                )}
                {registerMutation.isSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Registration successful! You can now log in.
                  </Alert>
                )}
                <Box component="form" onSubmit={handleRegister} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Login Name"
                    value={regLoginName}
                    onChange={(e) => setRegLoginName(e.target.value)}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Confirm Password"
                    type="password"
                    value={regPasswordConfirm}
                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                  />
                  <Divider sx={{ my: 2 }} />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="First Name"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Last Name"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                  />
                  <TextField
                    margin="normal"
                    fullWidth
                    label="Location"
                    value={regLocation}
                    onChange={(e) => setRegLocation(e.target.value)}
                  />
                  <TextField
                    margin="normal"
                    fullWidth
                    label="Description"
                    multiline
                    rows={2}
                    value={regDescription}
                    onChange={(e) => setRegDescription(e.target.value)}
                  />
                  <TextField
                    margin="normal"
                    fullWidth
                    label="Occupation"
                    value={regOccupation}
                    onChange={(e) => setRegOccupation(e.target.value)}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? 'Registering...' : 'Register Me'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default LoginRegister;
