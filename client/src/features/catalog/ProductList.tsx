import { Grid } from "@mui/material"
import { Product } from "../../app/models/product"
import ProductCard from "./ProductCard"

type Props = {
    products: Product[]
}

export default function ProductList({ products }: Props) {
    return (
        <Grid container spacing={3}>
            {products.map(product => (
                <Grid item xs={6} sm={6} md={3} display='flex' justifyContent='center' key={product.id}>
                    <ProductCard product={product} />
                </Grid>

            ))}
        </Grid>
    )
}