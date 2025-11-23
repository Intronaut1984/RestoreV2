import { AppBar, Badge, Box, IconButton, LinearProgress, List, ListItem, Toolbar, Typography, Menu, MenuItem, useTheme, useMediaQuery, Drawer } from "@mui/material";
import { DarkMode, LightMode, ShoppingCart, AccountCircle, FilterList as FilterListIcon, Search as SearchIcon } from '@mui/icons-material';
import { useState } from 'react';
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
    { title: 'catalog', path: '/catalog' },
    { title: 'about', path: '/about' },
    { title: 'exemplo', path: '/contact' },
    { title: 'exemplo', path: '/contact' },
    { title: 'exemlplo', path: '/contact' },
    { title: 'exemplo', path: '/contact' },
    { title: 'exemplo', path: '/contact' },
]

const rightLinks = [
    { title: 'login', path: '/login' },
    { title: 'register', path: '/register' }
]

const navStyles = {
    color: 'inherit',
    typography: 'h6',
    textDecoration: 'none',
    '&:hover': {
        color: 'grey.500'
    },
    '&.active': {
        color: '#baecf9'
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

    return (
        <AppBar position="fixed">
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box display='flex' alignItems='center'>
                    <IconButton color="inherit" onClick={openFilters} sx={{ display: { xs: 'inline-flex', md: 'none' } }}>
                        <FilterListIcon />
                    </IconButton>
                    <Typography component={NavLink} sx={navStyles} to='/' variant="h6">My Store</Typography>
                    <IconButton onClick={() => dispatch(setDarkMode())}>
                        {darkMode ? <DarkMode /> : <LightMode sx={{ color: 'yellow' }} />}
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
                                sx={navStyles}
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
                    <LinearProgress color="secondary" />
                </Box>
            )}
            {/* Mobile mid-links row: show names under the toolbar */}
            {isMobile && (
                <Box
                    sx={{
                        display: { xs: 'flex', md: 'none' },
                        alignItems: 'center',
                        py: 0.5,
                        bgcolor: 'inherit',
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
                                        color: 'inherit',
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