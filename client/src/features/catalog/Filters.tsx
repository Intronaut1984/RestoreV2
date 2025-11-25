import { Box, Button, Paper, Typography, Collapse } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from 'react';
// Search moved to NavBar for global access
import RadioButtonGroup from "../../app/shared/components/RadioButtonGroup";
import { useAppDispatch, useAppSelector } from "../../app/store/store";
import { resetParams, setOrderBy, setAnos, setGeneros } from "./catalogSlice";
import CheckboxButtons from "../../app/shared/components/CheckboxButtons";

const sortOptions = [
    { value: 'name', label: 'Alphabetical' },
    { value: 'priceDesc', label: 'Price: High to low' },
    { value: 'price', label: 'Price: Low to high' },
    { value: 'yearDesc', label: 'Ano: Mais recente' },
    { value: 'year', label: 'Ano: Mais antigo' }
]

type Props = {
    filtersData?: { generos: string[], anos: number[] }
}

export default function Filters({filtersData: data}: Props) {
    const { orderBy, anos, generos } = useAppSelector(state => state.catalog);
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const [openSort, setOpenSort] = useState(false);
    const [openGenres, setOpenGenres] = useState(false);
    const [openTypes, setOpenTypes] = useState(false);

    const selectedCount = (arr?: Array<string | number>) => (arr && arr.length) ? arr.length : 0;

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
                                    {orderBy === 'name' ? 'Alfabético' : orderBy === 'price' ? 'Preço: Menor para maior' : orderBy === 'priceDesc' ? 'Preço: Maior para menor' : orderBy === 'yearDesc' ? 'Ano: Mais recente' : orderBy === 'year' ? 'Ano: Mais antigo' : 'Todos'}
                                </Typography>
                                <Box component='span' sx={{ transform: openSort ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms' }}>›</Box>
                            </Box>
                        </Box>
                        <Collapse in={openSort} timeout={160}>
                            <Box sx={{ p: 2 }}>
                                <RadioButtonGroup selectedValue={orderBy} options={sortOptions} onChange={e => dispatch(setOrderBy(e.target.value))} />
                            </Box>
                        </Collapse>

                        {/* Generos */}
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
                                <CheckboxButtons items={(data?.generos ?? [])} checked={(generos ?? [])} onChange={(items: string[]) => dispatch(setGeneros(items))} />
                            </Box>
                        </Collapse>

                        {/* Ano de Lançamento */}

                        {/* Types */}
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
                                <CheckboxButtons items={(data?.anos ?? []).map(String)} checked={(anos ?? []).map(String)} onChange={(items: string[]) => dispatch(setAnos(items.map(Number)))} />
                            </Box>
                        </Collapse>
                    </Box>
                </Paper>
                <Box sx={{ mt: 1 }}>
                    <Button onClick={() => dispatch(resetParams())} variant='outlined'>Repor filtros</Button>
                </Box>
            </Box>

            {/* Mobile: unchanged stacked papers */}
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Box display='flex' flexDirection='column' gap={2}>
                    <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                        <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Ordenar</Typography>
                        <RadioButtonGroup selectedValue={orderBy} options={sortOptions} onChange={e => dispatch(setOrderBy(e.target.value))} />
                    </Paper>

                    <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                        <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Género</Typography>
                        <CheckboxButtons items={(data?.generos ?? [])} checked={(generos ?? [])} onChange={(items: string[]) => dispatch(setGeneros(items))} />
                    </Paper>

                    <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                        <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Ano de Lançamento</Typography>
                        <CheckboxButtons items={(data?.anos ?? []).map(String)} checked={(anos ?? []).map(String)} onChange={(items: string[]) => dispatch(setAnos(items.map(Number)))} />
                    </Paper>

                    <Box>
                        <Button onClick={() => dispatch(resetParams())} variant='outlined'>Repor filtros</Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}