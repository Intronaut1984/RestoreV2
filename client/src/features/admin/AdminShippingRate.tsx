import { useState, useEffect } from 'react';
import { Box, TextField, Typography, CircularProgress } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useGetShippingRateQuery, useUpdateShippingRateMutation } from './shippingRateApi';
import PageTitle from '../../app/shared/components/PageTitle';

export default function AdminShippingRate() {
    const { data: shippingRateData, isLoading } = useGetShippingRateQuery();
    const [updateShippingRate, { isLoading: isSubmitting }] = useUpdateShippingRateMutation();
    const [rate, setRate] = useState('0');
    const [freeShippingThreshold, setFreeShippingThreshold] = useState('100');

    useEffect(() => {
        if (!shippingRateData) return;
        if (shippingRateData.rate !== undefined && shippingRateData.rate !== null) {
            setRate(shippingRateData.rate.toString());
        }
        if (shippingRateData.freeShippingThreshold !== undefined && shippingRateData.freeShippingThreshold !== null) {
            setFreeShippingThreshold(shippingRateData.freeShippingThreshold.toString());
        }
    }, [shippingRateData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const rateValue = parseFloat(rate);
            const thresholdValue = parseFloat(freeShippingThreshold);
            if (isNaN(rateValue) || rateValue < 0) {
                alert('Por favor insira um valor válido');
                return;
            }
            if (isNaN(thresholdValue) || thresholdValue < 0) {
                alert('Por favor insira um valor válido para o mínimo de portes grátis');
                return;
            }

            await updateShippingRate({
                rate: rateValue,
                freeShippingThreshold: thresholdValue,
                updatedAt: new Date().toISOString()
            }).unwrap();
            
            alert('Taxa de entrega atualizada com sucesso!');
        } catch (error) {
            alert('Erro ao atualizar taxa de entrega');
            console.error('Error:', error);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
            <PageTitle title="Gerir Taxa de Entrega" variant="h4" />

            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Taxa de Entrega"
                    type="number"
                    inputProps={{ step: '0.01', min: '0' }}
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    sx={{ mb: 2 }}
                    placeholder="0.00"
                />

                <TextField
                    fullWidth
                    label="Mínimo para Portes Grátis"
                    type="number"
                    inputProps={{ step: '0.01', min: '0' }}
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    sx={{ mb: 2 }}
                    placeholder="100.00"
                    helperText="Ex.: 100 significa portes grátis acima de €100"
                />

                <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={isSubmitting}
                    fullWidth
                >
                    Guardar Taxa de Entrega
                </LoadingButton>
            </form>

            {shippingRateData?.updatedAt && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Última atualização: {new Date(shippingRateData.updatedAt).toLocaleDateString('pt-PT', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </Typography>
            )}
        </Box>
    );
}
