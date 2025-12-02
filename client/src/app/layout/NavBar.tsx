import { AppBar, Badge, Box, IconButton, LinearProgress, List, ListItem, Toolbar, Typography, Menu, MenuItem, useTheme, useMediaQuery, Drawer } from "@mui/material";
import { DarkMode, LightMode, ShoppingCart, AccountCircle, FilterList as FilterListIcon, Search as SearchIcon } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Link, NavLink } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/store";
import { setDarkMode } from "./uiSlice";
import { useFetchBasketQuery } from "../../features/basket/basketApi";
import UserMenu from "./UserMenu";
import { useUserInfoQuery } from "../../features/account/accountApi";
import Filters from '../../features/catalog/Filters';
import { useFetchFiltersQuery } from '../../features/catalog/catalogApi';
import Search from '../../features/catalog/Search';

const midLinks = [
    { title: 'Loja', path: '/catalog' },
    { title: 'sobre', path: '/about' },
    { title: 'promoções', path: '/catalog?hasDiscount=true' },
    { title: 'contactos', path: '/contact' },
    { title: 'exemplo', path: '/contact' },
    { title: 'exemplo', path: '/contact' },
    { title: 'exemplo', path: '/contact' },
]

const rightLinks = [
    { title: 'login', path: '/login' },
    { title: 'register', path: '/register' }
]

const navStyles = {
    typography: 'h6',
    textDecoration: 'none',
    '&:hover': {
        color: 'grey.500'
    }
}

export default function NavBar() {
    const {data: user} = useUserInfoQuery();
    const { isLoading, darkMode } = useAppSelector(state => state.ui);
    const dispatch = useAppDispatch();
    const { data: basket } = useFetchBasketQuery();
    const { data: filtersData } = useFetchFiltersQuery();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const location = useLocation();
    const isCatalogRoute = location.pathname.startsWith('/catalog');
    // removed isHome (previously used to color text) since brand is now an image
    const [anchorProfileEl, setAnchorProfileEl] = useState<null | HTMLElement>(null);
    const handleProfileOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorProfileEl(e.currentTarget);
    const handleProfileClose = () => setAnchorProfileEl(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const openFilters = () => setFiltersOpen(true);
    const closeFilters = () => setFiltersOpen(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const openSearch = () => setSearchOpen(true);
    const closeSearch = () => setSearchOpen(false);

    const itemCount = basket?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const { generos, anos, orderBy, searchTerm } = useAppSelector(state => state.catalog);

    // Close the filters drawer automatically on mobile when any catalog param changes
    useEffect(() => {
        if (isMobile && filtersOpen) {
            setFiltersOpen(false);
        }
    }, [generos, anos, orderBy, searchTerm, isMobile, filtersOpen]);

    return (
        <AppBar
            position="fixed"
            sx={{
                bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(6px)',
                boxShadow: 'none',
                zIndex: (theme) => theme.zIndex.appBar + 10
            }}
        >
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box display='flex' alignItems='center'>
                    {isCatalogRoute && (
                        <IconButton color="inherit" onClick={openFilters} sx={{ display: { xs: 'inline-flex', md: 'none' } }}>
                            <FilterListIcon />
                        </IconButton>
                    )}
                    <Box
                        component={NavLink}
                        to='/'
                        sx={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
                    >
                        <Box
                            component='img'
                            src='/images/logo.png'
                            alt='Logo'
                            sx={{ height: { xs: 28, md: 40 }, display: 'block' }}
                        />
                    </Box>
                    <IconButton onClick={() => dispatch(setDarkMode())}>
                        {darkMode ? <DarkMode /> : <LightMode sx={{ color: 'orange' }} />}
                    </IconButton>
                </Box>

                {isMobile ? (
                    // On mobile we show links under the toolbar (below icons)
                    <></>
                ) : (
                    <List sx={{ display: 'flex' }}>
                        {midLinks.map(({ title, path }, index) => (
                            <ListItem
                                component={NavLink}
                                to={path}
                                key={`${path}-${title}-${index}`}
                                sx={{
                                    ...navStyles,
                                    color: darkMode ? 'white' : 'black',
                                    fontWeight: 'normal',
                                    '&.active': {
                                        color: darkMode ? 'white' : 'black',
                                        fontWeight: 700,
                                        fontSize: '1.05rem'
                                    }
                                }}
                            >
                                {title.toUpperCase()}
                            </ListItem>
                        ))}
                    </List>
                )}

                <Box display='flex' alignItems='center'>
                    <IconButton component={Link} to='/basket' size="large" sx={{ color: 'inherit' }}>
                        <Badge badgeContent={itemCount} color="secondary">
                            <ShoppingCart />
                        </Badge>
                    </IconButton>

                    {/* Desktop search field */}
                    <Box sx={{ display: { xs: 'none', md: 'block' }, width: 280, ml: 2, mr: 1 }}>
                        <Search />
                    </Box>

                    {/* Mobile search icon opens top drawer */}
                    <IconButton color="inherit" onClick={openSearch} sx={{ display: { xs: 'inline-flex', md: 'none' } }}>
                        <SearchIcon />
                    </IconButton>

                    <Drawer anchor="top" open={searchOpen} onClose={closeSearch}>
                        <Box sx={{ p: 2 }}>
                            <Search />
                        </Box>
                    </Drawer>

                    {user ? (
                        <UserMenu user={user} />
                    ) : (
                        <>
                            <IconButton color="inherit" onClick={handleProfileOpen}>
                                <AccountCircle />
                            </IconButton>
                            <Menu anchorEl={anchorProfileEl} open={Boolean(anchorProfileEl)} onClose={handleProfileClose}>
                                {rightLinks.map(({ title, path }) => (
                                    <MenuItem component={Link} to={path} key={path} onClick={handleProfileClose}>
                                        {title.toUpperCase()}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </>
                    )}


                </Box>

            </Toolbar>
            {isLoading && (
                <Box sx={{ width: '100%' }}>
                    <LinearProgress color= "inherit" />
                </Box>
            )}
            {/* Mobile mid-links row: show names under the toolbar */}
            {isMobile && (
                <Box
                    sx={{
                        display: { xs: 'flex', md: 'none' },
                        alignItems: 'center',
                        py: 0.5,
                        overflowX: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        '&::-webkit-scrollbar': { display: 'none' }
                    }}
                >
                    <Box sx={{ display: 'inline-flex', gap: 2, px: 1 }}>
                        {midLinks.map(({ title, path }, index) => (
                            <Typography
                                key={`${path}-${title}-${index}`}
                                component={Link}
                                to={path}
                                sx={{
                                        ...navStyles,
                                        color: "Inherit",
                                        typography: 'body2',
                                        py: 1,
                                        px: 1.5,
                                        minWidth: 80,
                                        textDecoration: 'none',
                                        display: 'inline-block',
                                    }}
                            >
                                {title.toUpperCase()}
                            </Typography>
                        ))}
                    </Box>
                </Box>
            )}
            <Drawer anchor="left" open={filtersOpen} onClose={closeFilters}>
                <Box sx={{ width: 300, p: 2 }}>
                    {filtersData && <Filters filtersData={filtersData} />}
                </Box>
            </Drawer>
        </AppBar>
    )
}