import { useEffect, useState } from "react";
import { Box, TextField, Typography, Grid } from "@mui/material";
import { useGetContactQuery, useUpdateContactMutation, ContactDto } from "./contactApi";
import { toast } from "react-toastify";
import { LoadingButton } from "@mui/lab";

export default function AdminContact() {
    const { data, isLoading } = useGetContactQuery();
    const [updateContact, { isLoading: isUpdating }] = useUpdateContactMutation();
    const [formData, setFormData] = useState<ContactDto>({
        id: 0,
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        facebookUrl: '',
        instagramUrl: '',
        linkedinUrl: '',
        twitterUrl: '',
        whatsappNumber: '',
        companyName: '',
        taxId: '',
        updatedAt: new Date().toISOString(),
    });

    useEffect(() => {
        if (data) {
            setFormData(data);
        }
    }, [data]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateContact(formData).unwrap();
            toast.success('Contactos atualizados com sucesso!');
        } catch (error) {
            console.error('Failed to update contact:', error);
            toast.error('Erro ao atualizar contactos');
        }
    };

    if (isLoading) return <Typography>A carregar...</Typography>;

    return (
        <Box sx={{ maxWidth: '800px', mx: 'auto', p: 2 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Gerir Contactos</Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            type="email"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Telefone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Endereço"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Cidade"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Código Postal"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="País"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Nome da Empresa"
                            name="companyName"
                            value={formData.companyName || ''}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="NIF"
                            name="taxId"
                            value={formData.taxId || ''}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Redes Sociais</Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Facebook URL"
                            name="facebookUrl"
                            value={formData.facebookUrl || ''}
                            onChange={handleChange}
                            type="url"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Instagram URL"
                            name="instagramUrl"
                            value={formData.instagramUrl || ''}
                            onChange={handleChange}
                            type="url"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="LinkedIn URL"
                            name="linkedinUrl"
                            value={formData.linkedinUrl || ''}
                            onChange={handleChange}
                            type="url"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Twitter URL"
                            name="twitterUrl"
                            value={formData.twitterUrl || ''}
                            onChange={handleChange}
                            type="url"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="WhatsApp"
                            name="whatsappNumber"
                            value={formData.whatsappNumber || ''}
                            onChange={handleChange}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 1, pt: 2 }}>
                    <LoadingButton
                        type="submit"
                        variant="contained"
                        loading={isUpdating}
                    >
                        Guardar
                    </LoadingButton>
                </Box>
            </Box>
        </Box>
    );
}
