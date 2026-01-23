import { AppBar, Badge, Box, IconButton, LinearProgress, List, ListItem, Toolbar, Typography, Menu, MenuItem, useTheme, useMediaQuery, Drawer } from "@mui/material";
import { DarkMode, LightMode, ShoppingCart, AccountCircle, FilterList as FilterListIcon, Search as SearchIcon, FavoriteBorder } from '@mui/icons-material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useFetchFavoritesQuery, useRemoveFavoriteMutation } from '../../features/catalog/favoritesApi';
import { useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, NavLink } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/store";
import { setDarkMode } from "./uiSlice";
import { useFetchBasketQuery } from "../../features/basket/basketApi";
import UserMenu from "./UserMenu";
import { useUserInfoQuery } from "../../features/account/accountApi";
import Filters from '../../features/catalog/Filters';
import { useFetchFiltersQuery } from '../../features/catalog/catalogApi';
import Search from '../../features/catalog/Search';
import { useGetLogoQuery } from '../../features/admin/logoApi';

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
    const { data: favorites } = useFetchFavoritesQuery();
    const { data: logoData } = useGetLogoQuery();
    const [removeFavorite] = useRemoveFavoriteMutation();
    const [favoritesOpen, setFavoritesOpen] = useState(false);
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
    const closeFilters = useCallback(() => {
        setFiltersOpen(false);
        // Allow the drawer close animation/layout to settle, then scroll the
        // catalog into view. This addresses a production-only layout issue
        // where filtered items render far below the fold.
        setTimeout(() => {
            try {
                const el = document.getElementById('catalog-root');
                const toolbarOffset = isMobile ? 56 : 64;
                if (el) {
                    const top = el.getBoundingClientRect().top + window.pageYOffset - toolbarOffset;
                    window.scrollTo({ top, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } catch {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 180);
    }, [isMobile]);
    const [searchOpen, setSearchOpen] = useState(false);
    const openSearch = () => setSearchOpen(true);
    const closeSearch = () => setSearchOpen(false);

    const itemCount = basket?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const { generos, anos, orderBy, searchTerm } = useAppSelector(state => state.catalog);

    // Close the filters drawer automatically on mobile when any catalog param changes
    // NOTE: do not include `filtersOpen` in the dependency list — that caused
    // the drawer to immediately close after being opened on mobile.
    const filtersOpenRef = useRef(filtersOpen);
    useEffect(() => { filtersOpenRef.current = filtersOpen; }, [filtersOpen]);

    // Close the filters drawer automatically on mobile when any catalog param changes
    useEffect(() => {
        if (isMobile && filtersOpenRef.current) {
            // Use closeFilters to ensure we also scroll the catalog into view
            closeFilters();
        }
    }, [generos, anos, orderBy, searchTerm, isMobile, closeFilters]);

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
                            src={logoData?.url || '/images/logo.png'}
                            alt='Logo'
                            sx={{ height: { xs: 28, md: 40 }, maxWidth: '100%', objectFit: 'contain', display: 'block' }}
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
                    <IconButton size="large" sx={{ color: 'inherit' }} onClick={() => setFavoritesOpen(true)}>
                        <Badge badgeContent={favorites?.length ?? 0} color="secondary">
                            <FavoriteBorder />
                        </Badge>
                    </IconButton>

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

                    <Drawer anchor="top" open={searchOpen} onClose={closeSearch} sx={{ zIndex: (theme) => theme.zIndex.appBar + 20 }}>
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
            <Drawer anchor="left" open={filtersOpen} onClose={closeFilters} sx={{ zIndex: (theme) => theme.zIndex.appBar + 20 }}>
                <Box sx={{ width: 300, p: 2 }}>
                    {filtersData && <Filters filtersData={filtersData} onChangeComplete={closeFilters} />}
                </Box>
            </Drawer>
            <Drawer anchor="right" open={favoritesOpen} onClose={() => setFavoritesOpen(false)} sx={{ zIndex: (theme) => theme.zIndex.appBar + 20 }}>
                <Box sx={{ width: 360, p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Favoritos</Typography>
                    <List>
                        {favorites && favorites.length > 0 ? favorites.map(p => (
                            <ListItem key={p.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box component={Link} to={`/catalog/${p.id}`} onClick={() => setFavoritesOpen(false)} sx={{ display: 'flex', gap: 1, alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                                    <Box component="img" src={p.pictureUrl} alt={p.name} sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1 }} />
                                    <Box>
                                        <Typography variant="subtitle2">{p.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{p.price.toLocaleString(undefined, { style: 'currency', currency: 'BRL' })}</Typography>
                                    </Box>
                                </Box>
                                <IconButton onClick={async () => { try { await removeFavorite(p.id).unwrap(); } catch (err) { console.error(err); } }} edge="end" aria-label="remove-favorite">
                                    <FavoriteIcon color="error" />
                                </IconButton>
                            </ListItem>
                        )) : (
                            <ListItem>
                                <Typography variant="body2">Sem favoritos ainda.</Typography>
                            </ListItem>
                        )}
                    </List>
                </Box>
            </Drawer>
        </AppBar>
    )
}