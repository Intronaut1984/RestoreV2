import { IconButton, Menu, Fade, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { useState } from "react";
import { User } from "../models/user";
import { History, Inventory, Logout, Person, AccountCircle } from "@mui/icons-material";
import { useLogoutMutation } from "../../features/account/accountApi";
import { Link, useNavigate } from "react-router-dom";

type Props = {
    user: User
}

export default function UserMenu({ user }: Props) {
    const [logout] = useLogoutMutation();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        // close the menu immediately so overlay/backdrop is removed
        handleClose();
        try {
            await logout(undefined).unwrap();
            navigate('/');
        } catch (error) {
            console.error('Logout failed', error);
            // still navigate home to ensure UI isn't stuck
            navigate('/');
        }
    };

    return (
        <div>
            <IconButton onClick={handleClick} color='inherit' size='large'>
                <AccountCircle />
            </IconButton>
            <Menu
                id="fade-menu"
                MenuListProps={{
                    'aria-labelledby': 'fade-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                TransitionComponent={Fade}
            >
                <MenuItem disabled>
                    <ListItemText primary={user.email} />
                </MenuItem>
                <Divider />
                    <MenuItem component={Link} to='/profile' onClick={handleClose}>
                    <ListItemIcon>
                        <Person />
                    </ListItemIcon>
                    <ListItemText>Perfil</ListItemText>
                </MenuItem>
                <MenuItem component={Link} to='/orders' onClick={handleClose}>
                    <ListItemIcon>
                        <History />
                    </ListItemIcon>
                    <ListItemText>Minhas Encomendas</ListItemText>
                </MenuItem>
                {user.roles.includes('Admin') &&
                <MenuItem component={Link} to='/inventory' onClick={handleClose}>
                    <ListItemIcon>
                        <Inventory />
                    </ListItemIcon>
                    <ListItemText>Inventário</ListItemText>
                </MenuItem>}
                {user.roles.includes('Admin') &&
                <MenuItem component={Link} to='/admin/users' onClick={handleClose}>
                    <ListItemIcon>
                        <Inventory />
                    </ListItemIcon>
                    <ListItemText>Usuários (Admin)</ListItemText>
                </MenuItem>}
                {user.roles.includes('Admin') &&
                <MenuItem component={Link} to='/admin/promo' onClick={handleClose}>
                    <ListItemIcon>
                        <Inventory />
                    </ListItemIcon>
                    <ListItemText>Promo Bar</ListItemText>
                </MenuItem>}

                {user.roles.includes('Admin') &&
                <MenuItem component={Link} to='/admin/logo' onClick={handleClose}>
                    <ListItemIcon>
                        <Inventory />
                    </ListItemIcon>
                    <ListItemText>Gerir Logo</ListItemText>
                </MenuItem>}

                {user.roles.includes('Admin') &&
                <MenuItem component={Link} to='/admin/contact' onClick={handleClose}>
                    <ListItemIcon>
                        <Inventory />
                    </ListItemIcon>
                    <ListItemText>Gerir Contactos</ListItemText>
                </MenuItem>}

                {user.roles.includes('Admin') &&
                <MenuItem component={Link} to='/admin/shipping-rate' onClick={handleClose}>
                    <ListItemIcon>
                        <Inventory />
                    </ListItemIcon>
                    <ListItemText>Taxa de Entrega</ListItemText>
                </MenuItem>}

                {user.roles.includes('Admin') &&
                <MenuItem component={Link} to='/admin/heroblocks' onClick={handleClose}>
                    <ListItemIcon>
                        <Inventory />
                    </ListItemIcon>
                    <ListItemText>Criar Campanha</ListItemText>
                </MenuItem>}

                {user.roles.includes('Admin') &&
                <MenuItem component={Link} to='/admin/analytics' onClick={handleClose}>
                    <ListItemIcon>
                        <Inventory />
                    </ListItemIcon>
                    <ListItemText>Analytics</ListItemText>
                </MenuItem>}
                <Divider />
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <Logout />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                </MenuItem>
            </Menu>
        </div>
    );
}