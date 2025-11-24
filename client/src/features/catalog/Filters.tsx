import { Box, Button, Paper, Typography, Collapse, useTheme } from "@mui/material";
import { useState } from 'react';
// Search moved to NavBar for global access
import RadioButtonGroup from "../../app/shared/components/RadioButtonGroup";
import { useAppDispatch, useAppSelector } from "../../app/store/store";
import { resetParams, setBrands, setOrderBy, setTypes } from "./catalogSlice";
import CheckboxButtons from "../../app/shared/components/CheckboxButtons";

const sortOptions = [
    { value: 'name', label: 'Alphabetical' },
    { value: 'priceDesc', label: 'Price: High to low' },
    { value: 'price', label: 'Price: Low to high' },
]

type Props = {
    filtersData: {brands: string[]; types: string[];}
}

export default function Filters({filtersData: data}: Props) {
    const { orderBy, types, brands } = useAppSelector(state => state.catalog);
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const [openSort, setOpenSort] = useState(false);
    const [openBrands, setOpenBrands] = useState(false);
    const [openTypes, setOpenTypes] = useState(false);

    const selectedCount = (arr?: string[]) => (arr && arr.length) ? arr.length : 0;

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
                            <Typography sx={{ fontWeight: 700 }}>Sort</Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>{orderBy === 'name' ? 'Alphabetical' : orderBy === 'price' ? 'Price: Low to high' : orderBy === 'priceDesc' ? 'Price: High to low' : 'All'}</Typography>
                                <Box component='span' sx={{ transform: openSort ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms' }}>›</Box>
                            </Box>
                        </Box>
                        <Collapse in={openSort} timeout={160}>
                            <Box sx={{ p: 2 }}>
                                <RadioButtonGroup selectedValue={orderBy} options={sortOptions} onChange={e => dispatch(setOrderBy(e.target.value))} />
                            </Box>
                        </Collapse>

                        {/* Brands */}
                        <Box
                            onClick={() => setOpenBrands(s => !s)}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, borderRadius: 2, cursor: 'pointer', bgcolor: theme.palette.action.hover }}
                        >
                            <Typography sx={{ fontWeight: 700 }}>Brands</Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography color='text.secondary'>{selectedCount(brands) > 0 ? `${selectedCount(brands)} selected` : 'All'}</Typography>
                                <Box component='span' sx={{ transform: openBrands ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms' }}>›</Box>
                            </Box>
                        </Box>
                        <Collapse in={openBrands} timeout={160}>
                            <Box sx={{ p: 2 }}>
                                <CheckboxButtons items={data.brands} checked={brands} onChange={(items: string[]) => dispatch(setBrands(items))} />
                            </Box>
                        </Collapse>

                        {/* Types */}
                        <Box
                            onClick={() => setOpenTypes(s => !s)}
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, borderRadius: 2, cursor: 'pointer', bgcolor: theme.palette.action.hover }}
                        >
                            <Typography sx={{ fontWeight: 700 }}>Types</Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography color='text.secondary'>{selectedCount(types) > 0 ? `${selectedCount(types)} selected` : 'All'}</Typography>
                                <Box component='span' sx={{ transform: openTypes ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms' }}>›</Box>
                            </Box>
                        </Box>
                        <Collapse in={openTypes} timeout={160}>
                            <Box sx={{ p: 2 }}>
                                <CheckboxButtons items={data.types} checked={types} onChange={(items: string[]) => dispatch(setTypes(items))} />
                            </Box>
                        </Collapse>
                    </Box>
                </Paper>
                <Box sx={{ mt: 1 }}>
                    <Button onClick={() => dispatch(resetParams())} variant='outlined'>Reset filters</Button>
                </Box>
            </Box>

            {/* Mobile: unchanged stacked papers */}
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Box display='flex' flexDirection='column' gap={2}>
                    <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                        <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Sort</Typography>
                        <RadioButtonGroup selectedValue={orderBy} options={sortOptions} onChange={e => dispatch(setOrderBy(e.target.value))} />
                    </Paper>

                    <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                        <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Brands</Typography>
                        <CheckboxButtons items={data.brands} checked={brands} onChange={(items: string[]) => dispatch(setBrands(items))} />
                    </Paper>

                    <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                        <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 700 }}>Types</Typography>
                        <CheckboxButtons items={data.types} checked={types} onChange={(items: string[]) => dispatch(setTypes(items))} />
                    </Paper>

                    <Box>
                        <Button onClick={() => dispatch(resetParams())} variant='outlined'>Reset filters</Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}