import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme } from "@mui/material";
import { useDeleteUserMutation, useGetUsersQuery, useUpdateUserRoleMutation } from "./adminApi";
import PageTitle from "../../app/shared/components/PageTitle";

export default function AdminPanel() {
    const { data: users, isLoading, refetch } = useGetUsersQuery();
    const [updateRole] = useUpdateUserRoleMutation();
    const [deleteUser, { isLoading: deletingUser }] = useDeleteUserMutation();

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

    const handleDeleteUser = async (email: string) => {
        try {
            const ok = window.confirm(`Tem a certeza que quer apagar o utilizador ${email}?`);
            if (!ok) return;

            const deleteStoredData = window.confirm('Quer apagar também os dados guardados deste utilizador (encomendas, incidentes e avaliações)?');
            await deleteUser({ email, deleteStoredData }).unwrap();
            await refetch();
        } catch (error) {
            console.error(error);
        }
    }

    if (isLoading) return <div>Loading...</div>

    return (
        <Box component={Paper} sx={{p:2, backgroundColor: isLight ? 'rgba(255,255,255,0.5)' : undefined, borderRadius: 2}}>
            <PageTitle title="Admin - Usuários" variant="h4" />

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
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Button variant="contained" onClick={() => handleToggleAdmin(u.email, u.roles?.includes('Admin') ?? false)}>
                                            {u.roles?.includes('Admin') ? 'Remover Admin' : 'Tornar Admin'}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            onClick={() => handleDeleteUser(u.email)}
                                            disabled={deletingUser}
                                        >
                                            Apagar
                                        </Button>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}
