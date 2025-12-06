import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper, useTheme } from "@mui/material";
import { useGetUsersQuery, useUpdateUserRoleMutation } from "./adminApi";

export default function AdminPanel() {
    const { data: users, isLoading, refetch } = useGetUsersQuery();
    const [updateRole] = useUpdateUserRoleMutation();

    const theme = useTheme();
    const isLight = theme.palette.mode === 'light';

    const handleToggleAdmin = async (email: string, isAdmin: boolean) => {
        try {
            await updateRole({ email, role: isAdmin ? 'Member' : 'Admin' }).unwrap();
            await refetch();
        } catch (error) {
            console.error(error);
        }
    }

    if (isLoading) return <div>Loading...</div>

    return (
        <Box component={Paper} sx={{p:2, backgroundColor: isLight ? 'rgba(255,255,255,0.5)' : undefined, borderRadius: 2}}>
            <Typography variant="h4" sx={{mb:2}}>Admin - Usuários</Typography>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Email</TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell>Roles</TableCell>
                            <TableCell>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users?.map(u => (
                            <TableRow key={u.email}>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>{u.userName ?? '—'}</TableCell>
                                <TableCell>{u.roles?.join(', ')}</TableCell>
                                <TableCell>
                                    <Button variant="contained" onClick={() => handleToggleAdmin(u.email, u.roles?.includes('Admin') ?? false)}>
                                        {u.roles?.includes('Admin') ? 'Remover Admin' : 'Tornar Admin'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}
