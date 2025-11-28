import { Box, Button, TextField, Typography } from "@mui/material";
import { useGetPromoQuery, useUpdatePromoMutation } from "./adminApi";
import { useState, useEffect } from "react";

export default function AdminPromo() {
    const { data, isLoading, refetch } = useGetPromoQuery();
    const [updatePromo, { isLoading: isUpdating }] = useUpdatePromoMutation();
    const [message, setMessage] = useState('');
    const [color, setColor] = useState('#050505');

    useEffect(() => {
        if (data) {
            setMessage(data.message || '');
            setColor(data.color || '#050505');
        }
    }, [data]);

    const handleSave = async () => {
        try {
            await updatePromo({ message, color }).unwrap();
            await refetch();
            // notify other parts of the UI (PromoBar) about the update
            try {
                window.dispatchEvent(new CustomEvent('promoUpdated', { detail: { message, color } }));
            } catch (e) {
                // ignore
            }
        } catch (error) {
            console.error(error);
        }
    }

    if (isLoading) return <div>Loading...</div>

    return (
        <Box sx={{p:2}}>
            <Typography variant="h5" sx={{mb:2}}>Promo Bar</Typography>
            <Box sx={{display:'flex', flexDirection: 'column', gap:2, maxWidth: 700}}>
                <TextField label="Mensagem" multiline minRows={2} value={message} onChange={e => setMessage(e.target.value)} />
                <Box sx={{display:'flex', alignItems:'center', gap:2}}>
                    <TextField label="Cor (hex)" value={color} onChange={e => setColor(e.target.value)} sx={{width: 200}} />
                    {/* native color input - visible and synchronized with hex field */}
                    <input
                        type="color"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        style={{width: 36, height: 36, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer'}}
                        aria-label="Escolher cor"
                    />
                    <Box sx={{width: 36, height: 36, border: '1px solid #ccc', display: 'inline-block'}} />
                </Box>
                <Box>
                    <Button variant="contained" onClick={handleSave} disabled={isUpdating}>Salvar</Button>
                </Box>
            </Box>
        </Box>
    )
}
