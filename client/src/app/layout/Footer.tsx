import { Box, Container, Grid, Link, Typography, Divider } from "@mui/material";
import { useGetContactQuery } from "../../features/admin/contactApi";
import { useGetLogoQuery } from "../../features/admin/logoApi";
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useCookieConsent } from "./cookieConsent";
import { useEffect, useState } from 'react';

export default function Footer() {
    const { data: contactData } = useGetContactQuery();
    const { data: logoData } = useGetLogoQuery();
    const { openPreferences } = useCookieConsent();
    const [cachedLogoUrl, setCachedLogoUrl] = useState<string>(() => {
        try {
            return localStorage.getItem('logoUrl') ?? '';
        } catch {
            return '';
        }
    });

    useEffect(() => {
        if (!logoData?.url) return;
        try {
            localStorage.setItem('logoUrl', logoData.url);
            setCachedLogoUrl(logoData.url);
        } catch {
            // ignore
        }
    }, [logoData?.url]);

    const logoUrl = logoData?.url || cachedLogoUrl;

    const currentYear = new Date().getFullYear();

    return (
        <Box
            sx={{
                mt: 'auto',
                pt: 6,
                pb: 4,
                backgroundColor: (theme) =>
                    theme.palette.mode === 'light' 
                        ? '#f5f5f5'
                        : '#1a1a1a',
                borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            }}
        >
            <Container maxWidth='xl'>
                <Grid container spacing={4} sx={{ mb: 4 }}>
                    {/* Sobre */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            Sobre Nós
                        </Typography>
                        {logoUrl && (
                            <Box
                                component='img'
                                src={logoUrl}
                                alt='Logo'
                                sx={{ height: 50, mb: 2, maxWidth: '100%', objectFit: 'contain' }}
                            />
                        )}
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            {contactData?.companyName && `${contactData.companyName}`}
                        </Typography>
                        {contactData?.taxId && (
                            <Typography variant="body2" color="textSecondary">
                                NIF: {contactData.taxId}
                            </Typography>
                        )}
                    </Grid>

                    {/* Contactos */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            Contactos
                        </Typography>
                        {contactData?.email && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, gap: 1 }}>
                                <EmailIcon sx={{ fontSize: 20, flexShrink: 0, mt: 0.25 }} />
                                <Link href={`mailto:${contactData.email}`} underline="none" color="inherit" sx={{ wordBreak: 'break-word' }}>
                                    {contactData.email}
                                </Link>
                            </Box>
                        )}
                        {contactData?.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, gap: 1 }}>
                                <PhoneIcon sx={{ fontSize: 20, flexShrink: 0, mt: 0.25 }} />
                                <Link href={`tel:${contactData.phone}`} underline="none" color="inherit">
                                    {contactData.phone}
                                </Link>
                            </Box>
                        )}
                        {contactData?.address && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, gap: 1 }}>
                                <LocationOnIcon sx={{ fontSize: 20, flexShrink: 0, mt: 0.25 }} />
                                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                    {contactData.address}
                                    {contactData.postalCode && `, ${contactData.postalCode}`}
                                    {contactData.city && (
                                        <>
                                            <br />
                                            {contactData.city}
                                        </>
                                    )}
                                    {contactData.country && (
                                        <>
                                            {contactData.city ? ', ' : ''}
                                            {contactData.country}
                                        </>
                                    )}
                                </Typography>
                            </Box>
                        )}
                    </Grid>

                    {/* Links Úteis */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            Links Úteis
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <Link href="/register" underline="hover" color="inherit">
                                Subscrever Newsletter
                            </Link>
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <Link href="/contact" underline="hover" color="inherit">
                                Fale Connosco
                            </Link>
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <Link href="/privacy-policy" underline="hover" color="inherit">
                                Política de Privacidade
                            </Link>
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <Link href="/cookie-policy" underline="hover" color="inherit">
                                Política de Cookies
                            </Link>
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <Link
                                component="button"
                                underline="hover"
                                color="inherit"
                                onClick={(e) => {
                                    e.preventDefault();
                                    openPreferences();
                                }}
                                sx={{ textAlign: 'left' }}
                            >
                                Definições de cookies
                            </Link>
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <Link href="/terms" underline="hover" color="inherit">
                                Termos e Condições
                            </Link>
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <Link href="https://www.livroreclamacoes.pt/Inicio/" target="_blank" underline="hover" color="inherit">
                                Livro de Reclamações
                            </Link>
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <Link href="/return-policy" underline="hover" color="inherit">
                                Política de Devoluções
                            </Link>
                        </Typography>
                    </Grid>

                    {/* Redes Sociais */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            Siga-nos
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {contactData?.facebookUrl && (
                                <Link href={contactData.facebookUrl} target="_blank" rel="noopener" color="inherit" sx={{ display: 'inline-flex' }}>
                                    <FacebookIcon />
                                </Link>
                            )}
                            {contactData?.instagramUrl && (
                                <Link href={contactData.instagramUrl} target="_blank" rel="noopener" color="inherit" sx={{ display: 'inline-flex' }}>
                                    <InstagramIcon />
                                </Link>
                            )}
                            {contactData?.linkedinUrl && (
                                <Link href={contactData.linkedinUrl} target="_blank" rel="noopener" color="inherit" sx={{ display: 'inline-flex' }}>
                                    <LinkedInIcon />
                                </Link>
                            )}
                            {contactData?.twitterUrl && (
                                <Link href={contactData.twitterUrl} target="_blank" rel="noopener" color="inherit" sx={{ display: 'inline-flex' }}>
                                    <TwitterIcon />
                                </Link>
                            )}
                            {contactData?.whatsappNumber && (
                                <Link href={`https://wa.me/${contactData.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener" color="inherit" sx={{ display: 'inline-flex' }}>
                                    <Box component="span" sx={{ fontSize: 24 }}>
                                        💬
                                    </Box>
                                </Link>
                            )}
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                        © {currentYear} {contactData?.companyName || 'Loja'}. Todos os direitos reservados.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
