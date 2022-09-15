import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Button from '@mui/material/Button'
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import MenuItem from '@mui/material/MenuItem';
import supabase from '../../lib/supabase';

const pages = [ { label: 'Events', path: '/events' } ];

export default function Layout({ children }) {
  const router = useRouter();

  const [ signingOut, setSigningOut ] = useState(false);

  const [ anchorElNav, setAnchorElNav ] = useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handlePageItemClick = (path) => {
    handleCloseNavMenu();
    if (router.pathname !== path) {
      router.push(path);
    }
  };

  const handleLogout = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Login page
  if (router.pathname === '/login') {
    if (signingOut) {
      setSigningOut(false);
    }
    return children;
  }

  return (
    <>
      <AppBar position="static">
        <Container maxWidth={false}>
          <Toolbar disableGutters>
            <Typography
              variant="h6"
              noWrap
              component="a"
              href=""
              onClick={(e) => {
                e.preventDefault();
                handlePageItemClick('/events');
              }}
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <Image src="/images/rlc-logo.png" width={50} height={65} alt="RLC" />
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{
                  display: { xs: 'block', md: 'none' },
                }}
              >
                {pages.map((page) => (
                  <MenuItem key={page.path} onClick={() => handlePageItemClick(page.path)}>
                    <Typography textAlign="center">{page.label}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            <Typography
              variant="h5"
              noWrap
              component="a"
              href=""
              onClick={(e) => {
                e.preventDefault();
                handlePageItemClick('/events');
              }}
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <Image src="/images/rlc-logo.png" width={50} height={65} alt="RLC" />
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {pages.map((page) => (
                <Button
                  key={page.path}
                  onClick={() => handlePageItemClick(page.path)}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                >
                  {page.label}
                </Button>
              ))}
            </Box>
            <Box sx={{ flexGrow: 0 }}>
              <Button
                disabled={signingOut}
                onClick={handleLogout}
                sx={{ my: 2, color: 'white', display: 'block', fontWeight: 'bold' }}
              >
                {signingOut ? 'Logging Out' : 'Logout'}
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <main>
        {children}
      </main>
    </>
  );
};
