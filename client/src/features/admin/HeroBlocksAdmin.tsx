import { Box, Button, Card, CardContent, Grid, IconButton, TextField, Typography } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from "react";
import { useGetHeroBlocksQuery, useCreateHeroBlockMutation, useUpdateHeroBlockMutation, useDeleteHeroBlockMutation, useUploadHeroImageMutation, useDeleteHeroImageMutation } from "./heroBlocksApi";
import { useCreateCampaignMutation, useGetCampaignsQuery, useDeleteCampaignMutation } from "./adminApi";
import PageTitle from "../../app/shared/components/PageTitle";

// Local types for hero blocks/images returned by the API
type HeroImage = { id: number; url: string; publicId?: string; order?: number };
type HeroBlock = { id: number; title?: string; visible: boolean; order?: number; images?: HeroImage[] };

export default function HeroBlocksAdmin() {
    const { data: blocks, isLoading } = useGetHeroBlocksQuery();
    const blocksTyped = blocks as HeroBlock[] | undefined;
    const [createHeroBlock] = useCreateHeroBlockMutation();
    const [updateHeroBlock] = useUpdateHeroBlockMutation();
    const [deleteHeroBlock] = useDeleteHeroBlockMutation();
    const [uploadHeroImage] = useUploadHeroImageMutation();
    const [deleteHeroImage] = useDeleteHeroImageMutation();

    const [newTitle, setNewTitle] = useState('');
    const [createCampaign] = useCreateCampaignMutation();
    const { data: campaigns } = useGetCampaignsQuery();
    const [deleteCampaign] = useDeleteCampaignMutation();

    const handleCreate = async () => {
        try {
            await createHeroBlock({ title: newTitle, visible: true, order: (blocks?.length ?? 0) }).unwrap();
            // also create a campaign with the same name so admin can assign products
            try {
                await createCampaign({ name: newTitle }).unwrap();
            } catch (err) {
                // non-fatal: log but continue
                console.error('Failed creating campaign for hero block', err);
            }
            setNewTitle('');
        } catch (error) {
            console.error(error);
        }
    }

    const handleUploadFiles = async (id: number, files: FileList | null, existingCount: number) => {
        if (!files || files.length === 0) return;
        const maxAllowed = Math.max(0, 3 - existingCount);
        const toUpload = Array.from(files).slice(0, maxAllowed);
        for (const f of toUpload) {
            try {
                await uploadHeroImage({ id, file: f }).unwrap();
            } catch (err) {
                console.error(err);
            }
        }
    }

    const handleDeleteImage = async (blockId: number, imageId: number) => {
        try {
            await deleteHeroImage({ blockId, imageId }).unwrap();
        } catch (err) {
            console.error(err);
        }
    }

    if (isLoading) return <Typography>Loading...</Typography>

    return (
        <Box>
            <PageTitle title="Gerir Campanhas" variant="h5" />
            <Box sx={{ my: 2, display: 'flex', gap: 1 }}>
                <TextField label="Título" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                <Button variant="contained" onClick={handleCreate}>Criar Campanha</Button>
            </Box>

                {/* Existing campaigns list with delete support */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">Campanhas existentes</Typography>
                    {(!campaigns || campaigns.length === 0) && <Typography color="text.secondary">Nenhuma campanha</Typography>}
                    {campaigns?.map(c => (
                        <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
                            <Typography sx={{ flex: 1 }}>{c.name}</Typography>
                            <IconButton onClick={async () => {
                                if (!window.confirm(`Apagar campanha "${c.name}"?`)) return;
                                try {
                                    await deleteCampaign(c.id).unwrap();
                                } catch (err) {
                                    console.error('Failed deleting campaign', err);
                                }
                            }} title="Delete campaign"><DeleteIcon /></IconButton>
                        </Box>
                    ))}
                </Box>

            <Grid container spacing={2}>
                {blocksTyped?.map((b: HeroBlock) => (
                    <Grid item xs={12} md={6} key={b.id}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography>{b.title ?? `Block ${b.id}`}</Typography>
                                    <Box>
                                        <Button size="small" onClick={() => updateHeroBlock({ id: b.id, data: { visible: !b.visible, order: b.order } })}>{b.visible ? 'Hide' : 'Show'}</Button>
                                        <IconButton onClick={() => deleteHeroBlock(b.id)}><DeleteIcon /></IconButton>
                                    </Box>
                                </Box>

                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="subtitle2">Images (max 3)</Typography>
                                    {(!b.images || b.images.length === 0) && <Typography>No images</Typography>}
                                    {b.images?.map((img: HeroImage) => (
                                        <Box key={img.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', my: 1 }}>
                                            <img src={img.url} alt="hero" style={{ width: 120, height: 60, objectFit: 'cover' }} />
                                            <Typography sx={{ flex: 1, wordBreak: 'break-all' }}>{img.url}</Typography>
                                            <IconButton onClick={() => handleDeleteImage(b.id, img.id)} title="Delete image"><DeleteIcon /></IconButton>
                                        </Box>
                                    ))}

                                    <Box sx={{ mt: 1 }}>
                                        <input type="file" multiple onChange={(e) => handleUploadFiles(b.id, e.target.files, b.images?.length ?? 0)} />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    )
}
