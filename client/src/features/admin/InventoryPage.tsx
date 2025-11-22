import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Grid } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../app/store/store"
import { useFetchProductsQuery } from "../catalog/catalogApi";
import { currencyFormat } from "../../lib/util";
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
    return (
        <>
            <Box display='flex' justifyContent='space-between' alignItems='center'>
                <Typography sx={{p: 2}} variant='h4'>Inventory</Typography>
                <Button onClick={() => setEditMode(true)} sx={{m: 2}} size='large' variant='contained'>Create</Button>
            </Box>

            {/* Desktop/tablet: show table */}
            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Table sx={{minWidth: 650, tableLayout: 'fixed'}}>
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell align="left">Product</TableCell>
                            <TableCell align="right">Price</TableCell>
                            <TableCell align="center">Type</TableCell>
                            <TableCell align="center">Brand</TableCell>
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
                                    {product.id}
                                </TableCell>
                                <TableCell align="left" sx={{width: 300, maxWidth: 300}}>
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        <img 
                                            src={product.pictureUrl} 
                                            alt={product.name} 
                                            style={{height: 50, marginRight: 20, flex: '0 0 auto'}}
                                        />
                                        <Box sx={{flex: 1, minWidth: 0, overflow: 'hidden'}}>
                                            <Typography sx={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{product.name}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell align="right">{currencyFormat(product.price)}</TableCell>
                                <TableCell align="center">{product.type}</TableCell>
                                <TableCell align="center">{product.brand}</TableCell>
                                <TableCell align="center">{product.quantityInStock}</TableCell>
                                <TableCell align="right">
                                    <Button onClick={() => handleSelectProduct(product)} startIcon={<Edit />} />
                                    <Button onClick={() => handleDeleteProduct(product.id)} startIcon={<Delete />} color="error" />
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
                            <Paper sx={{p: 1}}>
                                <Box display='flex' flexDirection='column' alignItems='center'>
                                    <img src={product.pictureUrl} alt={product.name} style={{width: '100%', height: 100, objectFit: 'cover', borderRadius: 8}} />
                                    <Typography
                                        variant='subtitle2'
                                        sx={{
                                            mt: 1,
                                            textAlign: 'center',
                                            width: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {product.name}
                                    </Typography>
                                    <Typography variant='subtitle2' sx={{color: 'secondary.main'}}>{currencyFormat(product.price)}</Typography>
                                    <Box sx={{display: 'flex', gap:1, mt:1}}>
                                        <Button size='small' onClick={() => handleSelectProduct(product)} startIcon={<Edit />}>Edit</Button>
                                        <Button size='small' color='error' onClick={() => handleDeleteProduct(product.id)} startIcon={<Delete />}>Del</Button>
                                    </Box>
                                </Box>
                            </Paper>
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
        </>
    )
}