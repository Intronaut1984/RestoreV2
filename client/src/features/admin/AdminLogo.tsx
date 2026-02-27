import { Box, Button, Slider, TextField, Typography } from "@mui/material";
import { useGetLogoQuery, useUpdateLogoMutation } from "./logoApi";
import { useState, useEffect } from "react";
import { LoadingButton } from "@mui/lab";
import PageTitle from "../../app/shared/components/PageTitle";

type PreviewFile = File & { preview: string };

export default function AdminLogo() {
    const { data, isLoading } = useGetLogoQuery();
    const [updateLogo, { isLoading: isUpdating }] = useUpdateLogoMutation();
    const [logoUrl, setLogoUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<PreviewFile | null>(null);
    const [logoScale, setLogoScale] = useState<number>(1);

    useEffect(() => {
        if (data) {
            setLogoUrl(data.url || '/images/logo.png');
            setLogoScale(typeof data.scale === 'number' && Number.isFinite(data.scale) ? data.scale : 1);
        }
    }, [data]);

    // Cleanup preview URL when file changes or component unmounts
    useEffect(() => {
        return () => {
            if (selectedFile?.preview) {
                URL.revokeObjectURL(selectedFile.preview);
            }
        };
    }, [selectedFile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            const fileWithPreview = Object.assign(file, {
                preview: URL.createObjectURL(file)
            }) as PreviewFile;
            setSelectedFile(fileWithPreview);
        }
    };

    const handleSave = async () => {
        try {
            const formData = new FormData();
            
            // Add file if selected, otherwise add URL
            if (selectedFile) {
                formData.append('file', selectedFile);
            } else if (logoUrl && logoUrl !== data?.url) {
                formData.append('url', logoUrl);
            }

            formData.append('scale', String(logoScale));

            const scaleChanged = typeof data?.scale === 'number'
                ? Math.abs((data.scale ?? 1) - logoScale) > 0.001
                : Math.abs(1 - logoScale) > 0.001;

            if (formData.get('file') || formData.get('url') || scaleChanged) {
                await updateLogo(formData).unwrap();
                setSelectedFile(null);
                // Reset input
                const input = document.getElementById('logo-file-input') as HTMLInputElement;
                if (input) input.value = '';
            }
        } catch (error) {
            console.error('Failed to update logo:', error);
        }
    };

    if (isLoading) return <div>Loading...</div>

    return (
        <Box sx={{ p: 2 }}>
            <PageTitle title="Gerir Logo" variant="h4" />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 700 }}>
                
                {/* URL Input Option */}
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Opção 1: Introduzir URL</Typography>
                    <TextField
                        label="URL do Logo"
                        value={logoUrl}
                        onChange={e => {
                            setLogoUrl(e.target.value);
                            setSelectedFile(null);
                        }}
                        fullWidth
                        size="small"
                        disabled={selectedFile !== null}
                    />
                </Box>

                {/* File Upload Option */}
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Opção 2: Carregar ficheiro</Typography>
                    <Box
                        sx={{
                            border: 'dashed 2px',
                            borderColor: selectedFile ? 'green' : '#767676',
                            borderRadius: 1,
                            p: 2,
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: selectedFile ? 'rgba(76, 175, 80, 0.05)' : 'transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        <input
                            id="logo-file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="logo-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                            <Typography variant="body2" sx={{ color: selectedFile ? 'green' : 'textSecondary' }}>
                                {selectedFile ? `${selectedFile.name}` : 'Clique ou arraste uma imagem aqui'}
                            </Typography>
                        </label>
                    </Box>
                </Box>

                {/* Preview Section */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant="body2">Pré-visualização:</Typography>
                    <Box
                        component="img"
                        src={selectedFile?.preview || logoUrl}
                        alt="Logo Preview"
                        sx={{
                            height: Math.round(60 * logoScale),
                            display: 'block',
                            border: '1px solid #ccc',
                            borderRadius: 1,
                            objectFit: 'contain',
                            maxWidth: 150
                        }}
                        onError={() => console.log('Image failed to load')}
                    />
                </Box>

                {/* Scale control */}
                <Box sx={{ maxWidth: 520 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Tamanho do logo na barra: {Math.round(logoScale * 100)}%
                    </Typography>
                    <Slider
                        value={logoScale}
                        min={0.5}
                        max={3}
                        step={0.05}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                        onChange={(_, value) => {
                            const v = Array.isArray(value) ? value[0] : value;
                            setLogoScale(typeof v === 'number' && Number.isFinite(v) ? v : 1);
                        }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Ajusta proporcionalmente (sem esticar na horizontal/vertical).
                    </Typography>
                </Box>

                {/* Save Button */}
                <Box>
                    <LoadingButton
                        variant="contained"
                        onClick={handleSave}
                        loading={isUpdating}
                        disabled={!selectedFile && logoUrl === data?.url && (typeof data?.scale === 'number' ? Math.abs((data.scale ?? 1) - logoScale) <= 0.001 : Math.abs(1 - logoScale) <= 0.001)}
                    >
                        Salvar
                    </LoadingButton>
                    {selectedFile && (
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={() => {
                                setSelectedFile(null);
                                const input = document.getElementById('logo-file-input') as HTMLInputElement;
                                if (input) input.value = '';
                            }}
                            sx={{ ml: 1 }}
                        >
                            Cancelar Upload
                        </Button>
                    )}
                </Box>

                {/* Info Text */}
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 2 }}>
                    💡 Dica: Escolha uma imagem PNG ou SVG com fundo transparente para melhor resultado.
                </Typography>
            </Box>
        </Box>
    )
}

