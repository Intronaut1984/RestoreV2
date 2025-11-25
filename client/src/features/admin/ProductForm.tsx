import { FieldValues, useForm } from "react-hook-form";
import { createProductSchema, CreateProductSchema } from "../../lib/schemas/createProductSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Grid, Paper, Typography } from "@mui/material";
import AppTextInput from "../../app/shared/components/AppTextInput";
import AppSelectInput from "../../app/shared/components/AppSelectInput";
import AppDropzone from "../../app/shared/components/AppDropzone";
import { Product } from "../../app/models/product";
import { useEffect } from "react";
import { LoadingButton } from "@mui/lab";
import { handleApiError } from "../../lib/util";
import { useCreateProductMutation, useUpdateProductMutation } from "./adminApi";

// --- Tipagem segura para ficheiros com preview ---
type PreviewFile = File & { preview: string };

type Props = {
    setEditMode: (value: boolean) => void;
    product: Product | null;
    refetch: () => void;
    setSelectedProduct: (value: Product | null) => void;
};

export default function ProductForm({ setEditMode, product, refetch, setSelectedProduct }: Props) {
    const { control, handleSubmit, watch, reset, setError, formState: { isSubmitting } } =
        useForm<CreateProductSchema>({
            mode: "onTouched",
            resolver: zodResolver(createProductSchema)
        });

    const watchFile = watch("file");
    const genres = [
        "Ficção","NãoFicção","Fantasia","FicçãoCientífica","Mistério","Thriller","Terror",
        "Romance","Histórico","Juvenil","Infantil","Biografia","Autobiografia","Poesia",
        "AutoAjuda","Negócios","Ciências","Filosofia","Religião","Arte","Culinária","Viagens",
        "Saúde","Educação","BandaDesenhada","NovelaGráfica","Manga","Drama","Clássico","Crime"
    ];
    const [createProduct] = useCreateProductMutation();
    const [updateProduct] = useUpdateProductMutation();

    // 1) Atualizar valores quando "product" muda (evitar reset do file)
    useEffect(() => {
        if (product) reset(product);
    }, [product, reset]);

    // 2) Revogar preview anterior quando watchFile muda
    useEffect(() => {
        const file = watchFile as PreviewFile | undefined;

        return () => {
            if (file?.preview) {
                URL.revokeObjectURL(file.preview);
            }
        };
    }, [watchFile]);

    const createFormData = (items: FieldValues) => {
        const formData = new FormData();
        for (const key in items) {
            const value = items[key];
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        }
        return formData;
    };

    const onSubmit = async (data: CreateProductSchema) => {
        try {
            const formData = createFormData(data);

            if (watchFile) {
                formData.append("file", watchFile);
            }

            if (product) {
                await updateProduct({ id: product.id, data: formData }).unwrap();
            } else {
                await createProduct(formData).unwrap();
            }

            setEditMode(false);
            setSelectedProduct(null);
            refetch();
            } catch (error) {
            console.log(error);
            handleApiError<CreateProductSchema>(error, setError, [
                "description",
                "file",
                "name",
                "pictureUrl",
                "price",
                "quantityInStock",
                "genero",
                "anoPublicacao"
            ]);
        }
    };

    return (
        <Box component={Paper} sx={{ p: 4, maxWidth: 900, width: '100%', mx: "auto" }}>
            <Typography variant="h4" sx={{ mb: 4 }}>
                Product details
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <AppTextInput control={control} name="name" label="Product name" />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <AppSelectInput
                            items={genres}
                            control={control}
                            name="genero"
                            label="Género"
                            searchable
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <AppTextInput
                            type="number"
                            control={control}
                            name="anoPublicacao"
                            label="Ano de Publicação"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <AppTextInput
                            type="number"
                            control={control}
                            name="price"
                            label="Price"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <AppTextInput
                            type="number"
                            control={control}
                            name="quantityInStock"
                            label="Quantity in stock"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <AppTextInput
                            control={control}
                            multiline
                            rows={4}
                            name="description"
                            label="Description"
                        />
                    </Grid>

                    <Grid item xs={12} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flex: 1, width: '100%' }}>
                            <AppDropzone name="file" control={control} />
                        </Box>

                        <Box sx={{ mt: { xs: 1, sm: 0 } }}>
                            {watchFile && (watchFile as PreviewFile).preview ? (
                                <img
                                    src={(watchFile as PreviewFile).preview}
                                    alt="preview"
                                    style={{ maxHeight: 200, maxWidth: '100%', width: 'auto', display: 'block' }}
                                />
                            ) : product?.pictureUrl ? (
                                <img
                                    src={product.pictureUrl}
                                    alt="product"
                                    style={{ maxHeight: 200, maxWidth: '100%', width: 'auto', display: 'block' }}
                                />
                            ) : null}
                        </Box>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2 }}>
                    <Button onClick={() => setEditMode(false)} variant="contained" color="inherit" sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        Cancel
                    </Button>

                    <LoadingButton
                        loading={isSubmitting}
                        variant="contained"
                        color="success"
                        type="submit"
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        Submit
                    </LoadingButton>
                </Box>
            </form>
        </Box>
    );
}
