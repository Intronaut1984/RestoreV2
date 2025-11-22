import { IconButton, Menu, Fade, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { useState } from "react";
import { User } from "../models/user";
import { History, Inventory, Logout, Person, AccountCircle } from "@mui/icons-material";
import { useLogoutMutation } from "../../features/account/accountApi";
import { Link } from "react-router-dom";

type Props = {
    user: User
}

export default function UserMenu({ user }: Props) {
    const [logout] = useLogoutMutation();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
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
                <MenuItem>
                    <ListItemIcon>
                        <Person />
                    </ListItemIcon>
                    <ListItemText>My profile</ListItemText>
                </MenuItem>
                <MenuItem component={Link} to='/orders'>
                    <ListItemIcon>
                        <History />
                    </ListItemIcon>
                    <ListItemText>My orders</ListItemText>
                </MenuItem>
                {user.roles.includes('Admin') &&
                <MenuItem component={Link} to='/inventory'>
                    <ListItemIcon>
                        <Inventory />
                    </ListItemIcon>
                    <ListItemText>Inventory</ListItemText>
                </MenuItem>}
                <Divider />
                <MenuItem onClick={logout}>
                    <ListItemIcon>
                        <Logout />
                    </ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                </MenuItem>
            </Menu>
        </div>
    );
}