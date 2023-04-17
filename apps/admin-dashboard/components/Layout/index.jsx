import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import MenuItem from '@mui/material/MenuItem';
import isAdminUser from '../../lib/helpers/isAdminUser';

export default function Layout({ children }) {
  const supabase = useSupabaseClient();
  const user = useUser();

  const router = useRouter();

  const isAdmin = isAdminUser(user);

  const pages = useMemo(() => {
    const arr = [ { label: 'Existing Events', path: '/events' } ];

    if (isAdmin) {
      arr.push({ label: 'Create Event', path: '/events/new' });
    }

    return arr;
  }, [ isAdmin ]);


  const [ isRouting, setIsRouting ] = useState(false);

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
      setIsRouting(true);
      router.push(path).then(() => {
        setIsRouting(false);
      });
    }
  };

  const handleLogout = async () => {
    setIsRouting(true);
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/login').then(() => {
      setIsRouting(false);
    });
  };

  // Login page
  if (router.pathname === '/login') {
    if (signingOut) {
      setSigningOut(false);
      setIsRouting(false);
    }
    return children;
  }

  return (
    <>
      <Backdrop open={isRouting} sx={{ color: '#fff', zIndex: 5 }}>
        <CircularProgress />
      </Backdrop>
      <AppBar position="static">
        <Container maxWidth={false}>
          <Toolbar disableGutters>
            <Typography
              component="a"
              href=""
              noWrap
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
                textDecoration: 'none'
              }}
              variant="h6"
            >
              <Image alt="RLC" height={65} src="/images/rlc-logo.png" width={50} />
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                aria-controls="menu-appbar"
                aria-haspopup="true"
                aria-label="account of current user"
                color="inherit"
                onClick={handleOpenNavMenu}
                size="large"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
                id="menu-appbar"
                keepMounted
                onClose={handleCloseNavMenu}
                open={Boolean(anchorElNav)}
                sx={{
                  display: { xs: 'block', md: 'none' }
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left'
                }}
              >
                {pages.map((page) =>
                  <MenuItem key={page.path} onClick={() => handlePageItemClick(page.path)}>
                    <Typography textAlign="center">{page.label}</Typography>
                  </MenuItem>
                )}
              </Menu>
            </Box>
            <Typography
              href=""
              noWrap
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
                width: 'min-content'
              }}
              variant="h5"
            >
              <IconButton onClick={(e) => {
                e.preventDefault();
                handlePageItemClick('/events');
              }}>
                <Image alt="RLC" height={65} src="/images/rlc-logo.png" width={50} />
              </IconButton>
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {pages.map((page) =>
                <Button
                  key={page.path}
                  onClick={() => handlePageItemClick(page.path)}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                  style={{
                    border: '2px white solid',
                    borderRadius: '12px',
                    margin: '2px 8px',
                  }}
                >
                  {page.label}
                </Button>
              )}
            </Box>
            <Typography
              noWrap
              sx={{
                position: 'absolute',
                transform: 'translateX(-50%)',
                left: '50%',
                flexGrow: 1,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.5rem',
                color: 'inherit',
                textDecoration: 'none'
              }}
              variant="h4"
            >
              EVENTS DASHBOARD
            </Typography>
            {
              isAdmin ? (
                <Button
                  onClick={() => handlePageItemClick('/dashboard-users')}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                  style={{
                    border: '2px white solid',
                    borderRadius: '12px',
                    margin: '2px 8px',
                  }}
                >
                  Dashboard Users
                </Button>
              ) : null
            }
            <Box sx={{ flexGrow: 0 }}>
              <Button
                disabled={signingOut}
                onClick={handleLogout}
                sx={{ my: 2, color: 'white', display: 'block', fontWeight: 'bold' }}
                style={{
                  border: '2px #673ab7 solid',
                  borderRadius: '12px',
                  margin: '2px',
                  backgroundColor: 'white',
                  color: '#673ab7'
                }}
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

Layout.propTypes = {
  children: PropTypes.node.isRequired
};
