import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Registration state
  const [regLoginName, setRegLoginName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regDescription, setRegDescription] = useState('');
  const [regOccupation, setRegOccupation] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    if (!loginName.trim()) {
      setLoginError('Please enter a login name');
      setLoginLoading(false);
      return;
    }

    if (!loginPassword.trim()) {
      setLoginError('Please enter a password');
      setLoginLoading(false);
      return;
    }

    try {
      const userData = await loginUser(loginName, loginPassword);
      setUser(userData);
      navigate(`/users/${userData._id}`);
    } catch (err) {
      if (err.response?.status === 400) {
        setLoginError(err.response.data || 'Invalid login credentials');
      } else {
        setLoginError('An error occurred during login. Please try again.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    setRegLoading(true);

    // Validation
    if (!regLoginName.trim()) {
      setRegError('Login name is required');
      setRegLoading(false);
      return;
    }

    if (!regPassword.trim()) {
      setRegError('Password is required');
      setRegLoading(false);
      return;
    }

    if (!regPasswordConfirm.trim()) {
      setRegError('Please confirm your password');
      setRegLoading(false);
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setRegError('Passwords do not match');
      setRegLoading(false);
      return;
    }

    if (!regFirstName.trim()) {
      setRegError('First name is required');
      setRegLoading(false);
      return;
    }

    if (!regLastName.trim()) {
      setRegError('Last name is required');
      setRegLoading(false);
      return;
    }

    try {
      await registerUser({
        login_name: regLoginName.trim(),
        password: regPassword,
        first_name: regFirstName.trim(),
        last_name: regLastName.trim(),
        location: regLocation.trim(),
        description: regDescription.trim(),
        occupation: regOccupation.trim()
      });

      setRegSuccess('Registration successful! You can now log in.');

      // Clear form
      setRegLoginName('');
      setRegPassword('');
      setRegPasswordConfirm('');
      setRegFirstName('');
      setRegLastName('');
      setRegLocation('');
      setRegDescription('');
      setRegOccupation('');
    } catch (err) {
      if (err.response?.status === 400) {
        setRegError(err.response.data || 'Registration failed');
      } else {
        setRegError('An error occurred during registration. Please try again.');
      }
    } finally {
      setRegLoading(false);
    }
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
                {loginError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {loginError}
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
                    disabled={loginLoading}
                  >
                    {loginLoading ? 'Logging in...' : 'Login'}
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
                {regError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {regError}
                  </Alert>
                )}
                {regSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {regSuccess}
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
                    disabled={regLoading}
                  >
                    {regLoading ? 'Registering...' : 'Register Me'}
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
