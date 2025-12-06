import { Box, Button, Paper, Typography, Collapse } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from 'react';
// Search moved to NavBar for global access
import RadioButtonGroup from "../../app/shared/components/RadioButtonGroup";
import { useAppDispatch, useAppSelector } from "../../app/store/store";
import { resetParams, setOrderBy, setAnos, setGeneros, setCategories, setCampaigns } from "./catalogSlice";
import CheckboxButtons from "../../app/shared/components/CheckboxButtons";
import genres from "../../lib/genres";

const sortOptions = [
    { value: 'name', label: 'Alfabeticamente' },
    { value: 'priceDesc', label: 'Preço: Maior para menor' },
    { value: 'price', label: 'Preço: Menor para maior' },
    { value: 'discountDesc', label: 'Desconto: Maior para menor' },
    { value: 'discount', label: 'Desconto: Menor para maior' },
    { value: 'yearDesc', label: 'Ano: Mais recente' },
    { value: 'year', label: 'Ano: Mais antigo' }
]

type Props = {
    filtersData?: { generos: string[], anos: number[], categories?: { id: number; name: string }[], campaigns?: { id: number; name: string }[] }
    onChangeComplete?: () => void
}

export default function Filters({filtersData: data, onChangeComplete}: Props) {
    const { orderBy, anos, generos, categoryIds, campaignIds } = useAppSelector(state => state.catalog);
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const [openSort, setOpenSort] = useState(false);
    const [openGenres, setOpenGenres] = useState(false);
    const [openTypes, setOpenTypes] = useState(false);
    const [openCategories, setOpenCategories] = useState(false);
    const [openCampaigns, setOpenCampaigns] = useState(false);

    const selectedCount = (arr?: Array<string | number>) => (arr && arr.length) ? arr.length : 0;

    const mapGeneroLabel = (g: string) => {
        if (!g) return g;
        // if numeric, try to map to shared genres list
        const asNum = parseInt(g, 10);
        if (!Number.isNaN(asNum)) {
            // try both zero-based and one-based indexes
            if (genres[asNum]) return genres[asNum];
            if (genres[asNum - 1]) return genres[asNum - 1];
        }
        return g;
    }

    const generoItems = (data?.generos ?? []).map(g => ({ value: g, label: mapGeneroLabel(g) }));
    const categoryItems = (data?.categories ?? []).map(c => ({ value: String(c.id), label: c.name }));
    const campaignItems = (data?.campaigns ?? []).map(c => ({ value: String(c.id), label: c.name }));
    // Show the genero (genre) filter only when the user has selected a category
    // that indicates books (contains 'livro' in its name). This keeps the UI
    // simpler for non-book categories.
    const selectedCategoryNames = (data?.categories ?? []).filter(c => (categoryIds ?? []).includes(c.id)).map(c => c.name.toLowerCase());
    const showGenero = selectedCategoryNames.some(n => n.includes('livro'));

    return (
        <Box sx={{ width: '100%' }}>
            {/* Desktop: list of pill rows that expand */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Paper sx={{ p: 1, borderRadius: 2, boxShadow: 1, bgcolor: 'background.paper' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* Sort */}
                        <Box
                            onClick={() => setOpenSort(s => !s)}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, borderRadius: 2, cursor: 'pointer', bgcolor: theme.palette.action.hover }}
                        >
                            <Typography sx={{ fontWeight: 700 }}>Ordenar</Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
                                    {orderBy === 'name' ? 'Alfabético'
                                        : orderBy === 'price' ? 'Preço: Menor para maior'
                                        : orderBy === 'priceDesc' ? 'Preço: Maior para menor'
                                        : orderBy === 'discountDesc' ? 'Desconto: Maior para menor'
                                        : orderBy === 'discount' ? 'Desconto: Menor para maior'
                                        : orderBy === 'yearDesc' ? 'Ano: Mais recente'
                                        : orderBy === 'year' ? 'Ano: Mais antigo' : 'Todos'}
                                </Typography>
                                <Box component='span' sx={{ transform: openSort ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms' }}>›</Box>
                            </Box>
                        </Box>
                        <Collapse in={openSort} timeout={160}>
                            <Box sx={{ p: 2 }}>
                                <RadioButtonGroup selectedValue={orderBy} options={sortOptions} onChange={e => { dispatch(setOrderBy(e.target.value)); onChangeComplete?.(); }} />
                            </Box>
                        </Collapse>

                        {/* Generos (only shown when user selects a Books category) */}
                        {showGenero && (
                            <>
                                <Box
                                    onClick={() => setOpenGenres(s => !s)}
                                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, borderRadius: 2, cursor: 'pointer', bgcolor: theme.palette.action.hover }}
                                >
                                    <Typography sx={{ fontWeight: 700 }}>Género</Typography>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Typography color='text.secondary'>{selectedCount(generos) > 0 ? `${selectedCount(generos)} selecionados` : 'Todos'}</Typography>
                                        <Box component='span' sx={{ transform: openGenres ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms' }}>›</Box>
                                    </Box>
                                </Box>
                                <Collapse in={openGenres} timeout={160}>
                                    <Box sx={{ p: 2 }}>
                                        <CheckboxButtons items={generoItems} checked={(generos ?? [])} onChange={(items: string[]) => { dispatch(setGeneros(items)); onChangeComplete?.(); }} />
                                    </Box>
                                </Collapse>
                            </>
                        )}

                        {/* Categories */}
                        <Box
                            onClick={() => setOpenCategories(s => !s)}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, borderRadius: 2, cursor: 'pointer', bgcolor: theme.palette.action.hover }}
                        >
                            <Typography sx={{ fontWeight: 700 }}>Categorias</Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography color='text.secondary'>{selectedCount(categoryIds) > 0 ? `${selectedCount(categoryIds)} selecionadas` : 'Todas'}</Typography>
                                <Box component='span' sx={{ transform: openCategories ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms' }}>›</Box>
                            </Box>
                        </Box>
                        <Collapse in={openCategories} timeout={160}>
                            <Box sx={{ p: 2 }}>
                                <CheckboxButtons items={categoryItems} checked={(categoryIds ?? []).map(String)} onChange={(items: string[]) => { dispatch(setCategories(items.map(Number))); onChangeComplete?.(); }} />
                            </Box>
                        </Collapse>

                        {/* Campaigns */}
                        <Box
                            onClick={() => setOpenCampaigns(s => !s)}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, borderRadius: 2, cursor: 'pointer', bgcolor: theme.palette.action.hover }}
                        >
                            <Typography sx={{ fontWeight: 700 }}>Campanhas</Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography color='text.secondary'>{selectedCount(campaignIds) > 0 ? `${selectedCount(campaignIds)} selecionadas` : 'Todas'}</Typography>
                                <Box component='span' sx={{ transform: openCampaigns ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms' }}>›</Box>
                            </Box>
                        </Box>
                        <Collapse in={openCampaigns} timeout={160}>
                            <Box sx={{ p: 2 }}>
                                <CheckboxButtons items={campaignItems} checked={(campaignIds ?? []).map(String)} onChange={(items: string[]) => { dispatch(setCampaigns(items.map(Number))); onChangeComplete?.(); }} />
                            </Box>
                        </Collapse>

                        {/* Ano de Lançamento */}
                        <Box
                            onClick={() => setOpenTypes(s => !s)}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, borderRadius: 2, cursor: 'pointer', bgcolor: theme.palette.action.hover }}
                        >
                            <Typography sx={{ fontWeight: 700 }}>Ano de Lançamento</Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography color='text.secondary'>{selectedCount(anos) > 0 ? `${selectedCount(anos)} selecionados` : 'Todos'}</Typography>
                                <Box component='span' sx={{ transform: openTypes ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms' }}>›</Box>
                            </Box>
                        </Box>
                        <Collapse in={openTypes} timeout={160}>
                            <Box sx={{ p: 2 }}>
                                <CheckboxButtons items={(data?.anos ?? []).map(String)} checked={(anos ?? []).map(String)} onChange={(items: string[]) => { dispatch(setAnos(items.map(Number))); onChangeComplete?.(); }} />
                            </Box>
                        </Collapse>
                    </Box>
                </Paper>
                    <Box sx={{ mt: 1 }}>
                    <Button onClick={() => { dispatch(resetParams()); onChangeComplete?.(); }} variant='outlined'>Repor filtros</Button>
                </Box>
            </Box>

            {/* Mobile: unchanged stacked papers */}
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Box display='flex' flexDirection='column' gap={2}>
                    <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                        <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Ordenar</Typography>
                            <RadioButtonGroup selectedValue={orderBy} options={sortOptions} onChange={e => { dispatch(setOrderBy(e.target.value)); onChangeComplete?.(); }} />
                    </Paper>

                                        <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                                        <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Campaigns</Typography>
                                        <CheckboxButtons items={campaignItems} checked={(campaignIds ?? []).map(String)} onChange={(items: string[]) => { dispatch(setCampaigns(items.map(Number))); onChangeComplete?.(); }} />
                                    </Paper>

                        <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                        <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Categorias</Typography>
                        <CheckboxButtons items={categoryItems} checked={(categoryIds ?? []).map(String)} onChange={(items: string[]) => { dispatch(setCategories(items.map(Number))); onChangeComplete?.(); }} />
                    </Paper>

                    {showGenero && (
                        <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                            <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Género</Typography>
                            <CheckboxButtons items={generoItems} checked={(generos ?? [])} onChange={(items: string[]) => { dispatch(setGeneros(items)); onChangeComplete?.(); }} />
                        </Paper>
                    )}

                        <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                        <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Ano de Lançamento</Typography>
                        <CheckboxButtons items={(data?.anos ?? []).map(String)} checked={(anos ?? []).map(String)} onChange={(items: string[]) => { dispatch(setAnos(items.map(Number))); onChangeComplete?.(); }} />
                    </Paper>

                    <Box>
                        <Button onClick={() => { dispatch(resetParams()); onChangeComplete?.(); }} variant='outlined'>Repor filtros</Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}