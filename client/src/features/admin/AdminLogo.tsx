import { Box, Button, TextField, Typography } from "@mui/material";
import { useGetLogoQuery, useUpdateLogoMutation } from "./logoApi";
import { useState, useEffect } from "react";
import { LoadingButton } from "@mui/lab";

type PreviewFile = File & { preview: string };

export default function AdminLogo() {
    const { data, isLoading } = useGetLogoQuery();
    const [updateLogo, { isLoading: isUpdating }] = useUpdateLogoMutation();
    const [logoUrl, setLogoUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<PreviewFile | null>(null);

    useEffect(() => {
        if (data) {
            setLogoUrl(data.url || '/images/logo.png');
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

            if (formData.get('file') || formData.get('url')) {
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
            <Typography variant="h5" sx={{ mb: 2 }}>Gerir Logo</Typography>
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
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2">Pré-visualização:</Typography>
                    <Box
                        component="img"
                        src={selectedFile?.preview || logoUrl}
                        alt="Logo Preview"
                        sx={{
                            height: 60,
                            display: 'block',
                            border: '1px solid #ccc',
                            borderRadius: 1,
                            objectFit: 'contain',
                            maxWidth: 150
                        }}
                        onError={() => console.log('Image failed to load')}
                    />
                </Box>

                {/* Save Button */}
                <Box>
                    <LoadingButton
                        variant="contained"
                        onClick={handleSave}
                        loading={isUpdating}
                        disabled={!selectedFile && logoUrl === data?.url}
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

