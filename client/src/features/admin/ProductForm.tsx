import { FieldValues, useForm } from "react-hook-form";
import { createProductSchema, CreateProductSchema } from "../../lib/schemas/createProductSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Grid, Paper, Typography } from "@mui/material";
import AppTextInput from "../../app/shared/components/AppTextInput";
import AppSelectInput from "../../app/shared/components/AppSelectInput";
import AppDropzone from "../../app/shared/components/AppDropzone";
import { Product } from "../../app/models/product";
import { useEffect, useState } from "react";
import { LoadingButton } from "@mui/lab";
import { computeFinalPrice, currencyFormat } from '../../lib/util';
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
    const { control, handleSubmit, watch, reset, setError, formState: { isSubmitting }, setValue } =
        useForm<CreateProductSchema>({
            mode: "onTouched",
            resolver: zodResolver(createProductSchema)
        });

    const [removedSecondaryImages, setRemovedSecondaryImages] = useState<string[]>([]);

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
        if (product) {
            // map backend fields to form fields (only the fields the form needs)
            const mapped: Partial<CreateProductSchema> = {
                name: product.name,
                description: product.description ?? '',
                price: product.price,
                subtitle: product.subtitle ?? undefined,
                genero: product.genero ?? undefined,
                anoPublicacao: product.anoPublicacao ?? undefined,
                quantityInStock: product.quantityInStock,
                pictureUrl: product.pictureUrl ?? undefined,
                descontoPercentagem: product.discountPercentage ?? undefined,
            };
            reset(mapped as Partial<CreateProductSchema>);
            setRemovedSecondaryImages([]);
        }
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

    // compute final price for preview: use discount percentage only
    const watchedPrice = watch('price') as number | undefined;
    const watchedDiscount = watch('descontoPercentagem') as number | undefined;
    const finalPrice = computeFinalPrice(watchedPrice ?? 0, watchedDiscount);

    const createFormData = (items: FieldValues) => {
        const formData = new FormData();
        for (const key in items) {
            const value = items[key];
            if (value !== undefined && value !== null) {
                // handle arrays (tags) and files specially
                if (Array.isArray(value)) {
                    value.forEach(v => formData.append(key, v));
                } else {
                    formData.append(key, value);
                }
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

            // handle secondary files (multiple)
            const secondaryFiles = data.secondaryFiles as File[] | undefined;
            if (secondaryFiles && secondaryFiles.length) {
                secondaryFiles.forEach((f) => formData.append('secondaryFiles', f));
            }

            // include any removed secondary images when updating
            if (removedSecondaryImages && removedSecondaryImages.length) {
                removedSecondaryImages.forEach(u => formData.append('removedSecondaryImages', u));
            }

            // map discount percentage to backend expected key
            if (data.descontoPercentagem !== undefined) {
                formData.append('discountPercentage', String(data.descontoPercentagem));
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
                            name="descontoPercentagem"
                            label="Discount percentage"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography sx={{ mt: 2 }}>
                            {watchedDiscount && watchedDiscount > 0 ? (
                                <>
                                    <span style={{ textDecoration: 'line-through', marginRight: 8 }}>{currencyFormat(watchedPrice ?? 0)}</span>
                                    <span style={{ color: 'crimson', fontWeight: 700 }}>{currencyFormat(finalPrice ?? 0)}</span>
                                </>
                            ) : (
                                <span>{currencyFormat(finalPrice ?? 0)}</span>
                            )}
                        </Typography>
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
                            <Box sx={{ mt: 2 }}>
                                <input type="file" multiple onChange={(e) => {
                                    const files = e.target.files;
                                    if (files && files.length) {
                                        // store as secondaryFiles (array) in the form
                                        const arr = Array.from(files);
                                        setValue('secondaryFiles', arr as unknown as CreateProductSchema['secondaryFiles']);
                                    }
                                }} />
                            </Box>
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

                    {/* Secondary images thumbnails and removal UI */}
                    {product?.secondaryImages && product.secondaryImages.length > 0 && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>Existing secondary images</Typography>
                            <Box display='flex' gap={1} flexWrap='wrap'>
                                {product.secondaryImages.map((url, idx) => {
                                    const identifier = product.secondaryImagePublicIds?.[idx] ?? url;
                                    const removed = removedSecondaryImages.includes(identifier);
                                    return (
                                        <Box key={identifier} sx={{ position: 'relative' }}>
                                            <img src={url} alt="sec" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 4, opacity: removed ? 0.4 : 1 }} />
                                            <Button size="small" color={removed ? 'inherit' : 'error'} onClick={() => {
                                                if (removed) setRemovedSecondaryImages(prev => prev.filter(x => x !== identifier));
                                                else setRemovedSecondaryImages(prev => [...prev, identifier]);
                                            }} sx={{ position: 'absolute', top: 4, right: 4 }}>
                                                {removed ? 'Undo' : 'Remove'}
                                            </Button>
                                        </Box>
                                    )
                                })}
                            </Box>
                        </Grid>
                    )}
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
