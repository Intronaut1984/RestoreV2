import { useState, useEffect } from 'react';
import { Container, Typography, Grid, Box, Divider, TextField, Button, Stack, IconButton, InputAdornment, Paper, useTheme, FormControlLabel, Switch } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useUserInfoQuery, useFetchAddressQuery, useUpdateUserInfoMutation, useUpdateUserAddressMutation, useDeleteAccountMutation } from './accountApi';
import { useChangePasswordMutation } from './accountApi';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import PageTitle from '../../app/shared/components/PageTitle';

export default function ProfilePage() {
  const { data: user, isLoading: userLoading } = useUserInfoQuery();
  const { data: address, isLoading: addressLoading } = useFetchAddressQuery();
  const [updateUserInfo] = useUpdateUserInfoMutation();
  const [updateUserAddress, { isLoading: updatingAddress }] = useUpdateUserAddressMutation();
  const [changePassword, { isLoading: isChanging }] = useChangePasswordMutation();
  const [deleteAccount, { isLoading: deletingAccount }] = useDeleteAccountMutation();
  const [editing, setEditing] = useState(false);
  const [showUserNameEditor, setShowUserNameEditor] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [savingUserName, setSavingUserName] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteStoredData, setDeleteStoredData] = useState(false);

  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      email: '',
      userName: '',
      name: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    }
  });

  useEffect(() => {
    reset({
      email: user?.email ?? '',
      userName: user?.userName ?? '',
      name: address?.name ?? '',
      line1: address?.line1 ?? '',
      line2: address?.line2 ?? '',
      city: address?.city ?? '',
      state: address?.state ?? '',
      postal_code: address?.postal_code ?? '',
      country: address?.country ?? ''
    });
    // If the current username looks like an email (contains @), show the quick username editor
    if (user?.userName && user.userName.includes('@')) {
      setShowUserNameEditor(true);
      // Suggest a default value without the email domain
      const beforeAt = user.userName.split('@')[0];
      setNewUserName(beforeAt);
    } else {
      setShowUserNameEditor(false);
      setNewUserName('');
    }
  }, [user, address, reset]);

  if (userLoading) return <div>Loading profile...</div>;

  interface ProfileFormValues {
    email: string;
    userName: string;
    name?: string;
    line1?: string;
    line2?: string | null;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  }

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const { email, userName, name, line1, line2, city, state, postal_code, country } = values;

      // Update user info
      await updateUserInfo({ email, userName }).unwrap();

      // Update address - ensure required string fields are present (use empty string fallback)
      await updateUserAddress({
        name: name ?? '',
        line1: line1 ?? '',
        line2: line2 ?? null,
        city: city ?? '',
        state: state ?? '',
        postal_code: postal_code ?? '',
        country: country ?? ''
      }).unwrap();

      toast.success('Profile updated');
      setEditing(false);
    } catch (error: unknown) {
      const getErrorMessage = (err: unknown) => {
        if (!err) return 'Problem updating profile';
        if (typeof err === 'string') return err;
        if (typeof err === 'object') {
          const o = err as Record<string, unknown>;
          if (typeof o.data === 'string') return o.data;
          if (typeof o.message === 'string') return o.message;
        }
        return 'Problem updating profile';
      };

      toast.error(getErrorMessage(error));
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error('Preencha todas as passwords');
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error('A nova password e a confirmação não coincidem');
        return;
      }

      if (newPassword === currentPassword) {
        toast.error('A nova password não pode ser igual à atual');
        return;
      }

      await changePassword({ currentPassword, newPassword }).unwrap();
      toast.success('Password alterada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setChangingPassword(false);
    } catch (err) {
      const getErrorMessage = (err: unknown) => {
        if (!err) return 'Problem changing password';
        if (typeof err === 'string') return err;
        if (typeof err === 'object') {
          const o = err as Record<string, unknown>;
          if (typeof o.data === 'string') return o.data;
          if (typeof o.message === 'string') return o.message;
        }
        return 'Problem changing password';
      };

      toast.error(getErrorMessage(err));
    }
  };

  const handleSaveUserName = async () => {
    if (!newUserName || newUserName.trim().length === 0) {
      toast.error('Please enter a valid username');
      return;
    }
    if (newUserName.includes('@')) {
      toast.error('Username must not contain @');
      return;
    }

    try {
      setSavingUserName(true);
      await updateUserInfo({ userName: newUserName.trim() }).unwrap();
      toast.success('Username atualizado');
      setShowUserNameEditor(false);
      setNewUserName('');
    } catch (err) {
      toast.error('Problema ao atualizar username');
      console.error(err);
    } finally {
      setSavingUserName(false);
    }
  };

  const handleToggleNewsletter = async (next: boolean) => {
    try {
      await updateUserInfo({ newsletterOptIn: next }).unwrap();
      toast.success(next ? 'Newsletter ativada' : 'Newsletter desativada');
    } catch (err) {
      toast.error('Problema ao atualizar preferência de newsletter');
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const ok = window.confirm('Tem a certeza que quer apagar a sua conta? Esta ação não pode ser desfeita.');
      if (!ok) return;

      await deleteAccount({ deleteStoredData }).unwrap();
    } catch (err) {
      toast.error('Problema ao apagar conta');
      console.error(err);
    }
  };

  return (
    <Container
      component={Paper}
      maxWidth="md"
      sx={{
        mt: { xs: 8, md: 10 },
        borderRadius: 3,
        p: { xs: 2, sm: 4 },
        boxSizing: 'border-box',
        backgroundColor: isLight ? 'rgba(255,255,255,0.6)' : undefined
      }}
    >
      <Box sx={{ px: 0 }}>
        <PageTitle
          title={user?.userName && !user.userName.includes('@') ? `Olá, ${user.userName}` : 'Olá, User'}
          variant="h5"
        />

        {!editing ? (
          <>
            {/* Quick username editor shown when account username still looks like an email */}
            {showUserNameEditor && (
              <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  label="Escolha um nome de utilizador"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  size="small"
                />
                <Button variant="contained" onClick={handleSaveUserName} disabled={savingUserName}>
                  Guardar
                </Button>
                <Button variant="text" onClick={() => { setShowUserNameEditor(false); setNewUserName(''); }}>
                  Cancelar
                </Button>
              </Box>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography>{user?.email ?? '-'}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                  <Typography variant="subtitle2">Username</Typography>
                  <Typography>{user?.userName ?? '-'}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                  <Typography variant="subtitle2">Roles</Typography>
                  <Typography>{user?.roles?.join(', ') ?? '-'}</Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                  <Typography variant="subtitle2">Newsletter</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={user?.newsletterOptIn ?? true}
                        onChange={(e) => handleToggleNewsletter(e.target.checked)}
                      />
                    }
                    label={(user?.newsletterOptIn ?? true) ? 'Ativa' : 'Desativada'}
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6">Endereço Guardado</Typography>
                {addressLoading ? (
                  <Typography>A Carregar Endereço...</Typography>
                ) : address ? (
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                        <Typography>{address.name}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                        <Typography>{address.line1}</Typography>
                      </Box>
                    </Grid>
                    {address.line2 && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                          <Typography>{address.line2}</Typography>
                        </Box>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                        <Typography>
                          {address.city}, {address.state} {address.postal_code}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                        <Typography>{address.country}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography>Sem endereço guardado</Typography>
                )}
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button variant="contained" onClick={() => setEditing(true)}>Editar</Button>
              <Button variant="outlined" onClick={() => setChangingPassword(s => !s)}>Alterar Password</Button>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Apagar conta</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={deleteStoredData}
                    onChange={(e) => setDeleteStoredData(e.target.checked)}
                  />
                }
                label="Apagar também os dados guardados (ex.: encomendas, incidentes e avaliações)"
              />
              <Box sx={{ mt: 1 }}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                >
                  Apagar conta
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="email"
                  control={control}
                  rules={{ required: 'Email is required' }}
                  render={({ field, fieldState }) => (
                    <TextField {...field} label="Email" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="userName"
                  control={control}
                  rules={{ required: 'Username is required' }}
                  render={({ field, fieldState }) => (
                    <TextField {...field} label="Username" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6">Endereço Guardado</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller name="name" control={control} render={({ field }) => <TextField {...field} label="Full name" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="line1" control={control} render={({ field }) => <TextField {...field} label="Line 1" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="line2" control={control} render={({ field }) => <TextField {...field} label="Line 2" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="city" control={control} render={({ field }) => <TextField {...field} label="City" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="state" control={control} render={({ field }) => <TextField {...field} label="State" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="postal_code" control={control} render={({ field }) => <TextField {...field} label="Postal code" fullWidth />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="country" control={control} render={({ field }) => <TextField {...field} label="Country" fullWidth />} />
              </Grid>

              <Grid item xs={12} sx={{ mt: 1 }}>
                <Stack direction="row" spacing={2}>
                  <Button type="submit" variant="contained" disabled={updatingAddress}>Guardar</Button>
                  <Button variant="outlined" onClick={() => setEditing(false)}>Cancelar</Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        )}

        {changingPassword && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Alterar Password</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', maxWidth: 480, mt: 1 }}>
                <TextField
                  label="Password atual"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowCurrent(s => !s)} edge="end">
                          {showCurrent ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <TextField
                  label="Nova password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowNew(s => !s)} edge="end">
                          {showNew ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <TextField
                  label="Confirmar nova password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirm(s => !s)} edge="end">
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <Box>
                  <Button
                    variant="contained"
                    onClick={handleChangePassword}
                    disabled={isChanging || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword === currentPassword}
                  >
                    Guardar password
                  </Button>
                  <Button variant="text" onClick={() => setChangingPassword(false)}>Cancelar</Button>
                </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
}
