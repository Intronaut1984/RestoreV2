import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Grid } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../app/store/store"
import { useFetchProductsQuery, useFetchFiltersQuery } from "../catalog/catalogApi";
import Filters from "../catalog/Filters";
import { currencyFormat, computeFinalPrice } from "../../lib/util";
import { Delete, Edit } from "@mui/icons-material";
import AppPagination from "../../app/shared/components/AppPagination";
import { setPageNumber } from "../catalog/catalogSlice";
import { useState } from "react";
import ProductForm from "./ProductForm";
import { Product } from "../../app/models/product";
import { useDeleteProductMutation } from "./adminApi";

export default function InventoryPage() {
    const productParams = useAppSelector(state => state.catalog);
    const {data, refetch} = useFetchProductsQuery(productParams);
    const {data: filtersData, isLoading: filtersLoading} = useFetchFiltersQuery();
    const dispatch = useAppDispatch();
    const [editMode, setEditMode] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [deleteProduct] = useDeleteProductMutation();

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        setEditMode(true);
    }

    const handleDeleteProduct = async (id: number) => {
        try {
            await deleteProduct(id);
            refetch();
        } catch (error) {
            console.log(error);
        }
    }

    if (editMode) return <ProductForm 
        setEditMode={setEditMode} 
        product={selectedProduct} 
        refetch={refetch}
        setSelectedProduct={setSelectedProduct}
    />
    if (!filtersData && !filtersLoading && !data) return <div>Loading...</div>

    return (
        <>
            <Box display='flex' justifyContent='space-between' alignItems='center'>
                <Typography sx={{p: 2}} variant='h4'>Inventário</Typography>
                <Button onClick={() => setEditMode(true)} sx={{m: 2}} size='large' variant='contained'>Create</Button>
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
                    {filtersData && <Filters filtersData={filtersData} />}
                </Grid>
                <Grid item xs={12} md={9}>
                    {/* Desktop/tablet: show table */}
                    <TableContainer component={Box} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Table sx={{minWidth: 650, tableLayout: 'fixed'}}>
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell align="left">Product</TableCell>
                            <TableCell align="right">Price</TableCell>
                            <TableCell align="center">Género</TableCell>
                            <TableCell align="center">Ano</TableCell>
                            <TableCell align="center">Quantity</TableCell>
                            <TableCell align="right"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data && data.items.map(product => (
                            <TableRow
                                key={product.id}
                                sx={{
                                    '&:last-child td, &:last-child th': {border: 0}
                                }}
                            >
                                <TableCell component='th' scope="row">
                                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block' }}>{product.id}</Box>
                                </TableCell>
                                <TableCell align="left" sx={{width: 300, maxWidth: 300}}>
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        <img 
                                            src={product.pictureUrl} 
                                            alt={product.name} 
                                            style={{height: 50, marginRight: 20, flex: '0 0 auto'}}
                                        />
                                        <Box sx={{flex: 1, minWidth: 0, overflow: 'hidden'}}>
                                            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                                                <Typography sx={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{product.name}</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                                        {product.discountPercentage && product.discountPercentage > 0 ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                <span style={{ textDecoration: 'line-through', color: 'gray' }}>{currencyFormat(product.price)}</span>
                                                <span style={{ color: 'crimson', fontWeight: 700 }}>{currencyFormat(computeFinalPrice(product.price, product.discountPercentage))}</span>
                                                <span style={{ fontSize: 12, background: 'crimson', color: 'white', padding: '2px 6px', borderRadius: 4 }}>{`-${product.discountPercentage}%`}</span>
                                            </Box>
                                        ) : (
                                            <Box sx={{ textAlign: 'right' }}>{currencyFormat(product.price)}</Box>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell align="center"><Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>{product.genero ?? '—'}</Box></TableCell>
                                <TableCell align="center"><Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>{product.anoPublicacao ?? '—'}</Box></TableCell>
                                <TableCell align="center"><Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>{product.quantityInStock}</Box></TableCell>
                                                <TableCell align="right">
                                                    <Button onClick={() => handleSelectProduct(product)} startIcon={<Edit />} variant='contained' color='primary' size='small' />
                                                    <Button onClick={() => handleDeleteProduct(product.id)} startIcon={<Delete />} color="error" size='small' sx={{ ml: 1 }} />
                                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Box sx={{p: 3}}>
                    {data?.pagination && data.items.length > 0 && (
                        <AppPagination 
                            metadata={data.pagination}
                            onPageChange={(page: number) => dispatch(setPageNumber(page))}
                        />
                    )}
                </Box>
            </TableContainer>

            {/* Mobile: show cards */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 2 }}>
                <Grid container spacing={2}>
                    {data && data.items.map(product => (
                        <Grid item xs={6} sm={4} key={product.id}>
                            <Box sx={{p: 1}}>
                                <Box display='flex' flexDirection='column' alignItems='center'>
                                    <img src={product.pictureUrl} alt={product.name} style={{width: '100%', height: 100, objectFit: 'cover', borderRadius: 8}} />
                                    <Box sx={{ mt: 1, width: '100%' }}>
                                        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
                                            <Typography
                                                variant='subtitle2'
                                                sx={{
                                                    textAlign: 'center',
                                                    width: '100%',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {product.name}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mt: 1, textAlign: 'center' }}>
                                            {product.discountPercentage && product.discountPercentage > 0 ? (
                                                <>
                                                    <Typography variant='body2' sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>{currencyFormat(product.price)}</Typography>
                                                    <Typography variant='subtitle2' sx={{color: 'crimson', fontWeight: 700}}>{currencyFormat(computeFinalPrice(product.price, product.discountPercentage))}</Typography>
                                                </>
                                            ) : (
                                                <Typography variant='subtitle2' sx={{color: 'secondary.main'}}>{currencyFormat(product.price)}</Typography>
                                            )}
                                        </Box>
                                        <Box sx={{display: 'flex', gap:1, mt:1, justifyContent: 'center'}}>
                                            <Button size='small' onClick={() => handleSelectProduct(product)} startIcon={<Edit />} variant='contained' color='primary'>Edit</Button>
                                            <Button size='small' color='error' onClick={() => handleDeleteProduct(product.id)} startIcon={<Delete />}>Del</Button>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                <Box sx={{p: 2}}>
                    {data?.pagination && data.items.length > 0 && (
                        <AppPagination 
                            metadata={data.pagination}
                            onPageChange={(page: number) => dispatch(setPageNumber(page))}
                        />
                    )}
                </Box>
            </Box>
                </Grid>
            </Grid>
        </>
    )
}