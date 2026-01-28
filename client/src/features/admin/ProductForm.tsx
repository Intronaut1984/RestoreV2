import { FieldValues, useForm } from "react-hook-form";
import { createProductSchema, CreateProductSchema } from "../../lib/schemas/createProductSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Grid, Paper, Typography, Autocomplete, TextField, Chip } from "@mui/material";
import AppTextInput from "../../app/shared/components/AppTextInput";
import AppSelectInput from "../../app/shared/components/AppSelectInput";
import AppDropzone from "../../app/shared/components/AppDropzone";
import { Product } from "../../app/models/product";
import { Category } from "../../app/models/category";
import { Campaign } from "../../app/models/campaign";
import { useEffect, useMemo, useRef, useState } from "react";
import { LoadingButton } from "@mui/lab";
import { computeFinalPrice, currencyFormat } from '../../lib/util';
import { handleApiError } from "../../lib/util";
import { useCreateProductMutation, useUpdateProductMutation, useGetCampaignsQuery, useGetCategoriesQuery, useCreateCategoryMutation } from "./adminApi";
import genres from "../../lib/genres";

// --- Tipagem segura para ficheiros com preview ---
type PreviewFile = File & { preview: string };
type SecondaryPreviewFile = File & { preview: string };

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
    const [removedSecondaryUploads, setRemovedSecondaryUploads] = useState<string[]>([]);

    const watchFile = watch("file");
    const watchSecondaryFiles = watch('secondaryFiles') as unknown as SecondaryPreviewFile[] | undefined;
    const secondaryPrevRef = useRef<SecondaryPreviewFile[]>([]);
    const [createProduct] = useCreateProductMutation();
    const [updateProduct] = useUpdateProductMutation();
    const [createCategory] = useCreateCategoryMutation();
    const { data: campaigns } = useGetCampaignsQuery();
    const { data: categories } = useGetCategoriesQuery();

    const [selectedCategories, setSelectedCategories] = useState<Array<Category | string>>(product?.categories ?? []);
    const [categoryInput, setCategoryInput] = useState<string>('');
    const [selectedCampaigns, setSelectedCampaigns] = useState<{ id: number; name: string }[]>(product?.campaigns ?? []);
    
    const isBook = (cats: Array<Category | string> | null | undefined) => {
        return (cats ?? []).some(c => {
            const n = (typeof c === 'string' ? c : c.name ?? '').toLowerCase();
            return n.includes('livro') || n.includes('livros');
        });
    }

    const isClothingOrToy = (cats: Array<Category | string> | null | undefined) => {
        return (cats ?? []).some(c => {
            const n = (typeof c === 'string' ? c : c.name ?? '').toLowerCase();
            return ['vestuario', 'vestuário', 'roupa', 'roupas', 'brinquedo', 'brinquedos'].some(k => n.includes(k));
        });
    }

    const isTechnology = (cats: Array<Category | string> | null | undefined) => {
        return (cats ?? []).some(c => {
            const n = (typeof c === 'string' ? c : c.name ?? '').toLowerCase();
            return ['tecnologia', 'tecnológico', 'tecnologicos', 'tech', 'eletronica', 'eletrónica', 'eletronics', 'eletrónicos', 'electronica', 'eletrónicos'].some(k => n.includes(k));
        });
    }

    const isToy = (cats: Array<Category | string> | null | undefined) => {
        return (cats ?? []).some(c => {
            const n = (typeof c === 'string' ? c : c.name ?? '').toLowerCase();
            return ['brinquedo', 'brinquedos', 'toy', 'toys'].some(k => n.includes(k));
        });
    }

    // When categories change, clear fields that are no longer applicable.
    // Without this, hidden inputs can keep their previous values and get submitted.
    useEffect(() => {
        const book = isBook(selectedCategories);
        const clothingOrToy = isClothingOrToy(selectedCategories);
        const tech = isTechnology(selectedCategories);
        const toy = isToy(selectedCategories);

        if (!book) {
            setValue('genero', undefined);
            setValue('author', undefined);
            setValue('secondaryAuthors', undefined);
            setValue('anoPublicacao', undefined);
            setValue('isbn', undefined);
            setValue('publisher', undefined);
            setValue('edition', undefined);
            setValue('synopsis', undefined);
            setValue('index', undefined);
            setValue('pageCount', undefined);
            setValue('language', undefined);
            setValue('format', undefined);
            setValue('dimensoes', undefined);
            setValue('weight', undefined);
        }

        if (!clothingOrToy) {
            setValue('cor', undefined);
            setValue('material', undefined);
            setValue('tamanho', undefined);
            setValue('marca', undefined);
        }

        if (!tech) {
            setValue('tipo', undefined);
            setValue('modelo', undefined);
            setValue('capacidade', undefined);
        }

        if (!toy) {
            setValue('idadeMinima', undefined);
            setValue('idadeMaxima', undefined);
        }
    }, [selectedCategories, setValue]);

    // 1) Atualizar valores quando "product" muda (evitar reset do file)
    useEffect(() => {
        if (product) {
            // map backend fields to form fields (only the fields the form needs)
            const mapped: Partial<CreateProductSchema> = {
                name: product.name,
                description: product.description ?? '',
                author: product.author ?? undefined,
                secondaryAuthors: product.secondaryAuthors ?? undefined,
                price: product.price,
                subtitle: product.subtitle ?? undefined,
                genero: product.genero ?? undefined,
                anoPublicacao: product.anoPublicacao ?? undefined,
                isbn: product.isbn ?? undefined,
                publisher: product.publisher ?? undefined,
                edition: product.edition != null ? String(product.edition) : undefined,
                precoPromocional: product.promotionalPrice ?? undefined,
                synopsis: product.synopsis ?? undefined,
                index: product.index ?? undefined,
                pageCount: product.pageCount ?? undefined,
                language: product.language ?? undefined,
                format: product.format ?? undefined,
                dimensoes: product.dimensoes ?? undefined,
                weight: product.weight ?? undefined,
                quantityInStock: product.quantityInStock,
                pictureUrl: product.pictureUrl ?? undefined,
                descontoPercentagem: product.discountPercentage ?? undefined,
                cor: product.cor ?? undefined,
                material: product.material ?? undefined,
                tamanho: product.tamanho ?? undefined,
                marca: product.marca ?? undefined,
                tipo: product.tipo ?? undefined,
                modelo: product.modelo ?? undefined,
                capacidade: product.capacidade ?? undefined,
                idadeMinima: product.idadeMinima ?? undefined,
                idadeMaxima: product.idadeMaxima ?? undefined,
            };
            reset(mapped as Partial<CreateProductSchema>);
            setRemovedSecondaryImages([]);
            // initialise selected categories/campaigns in form
            if (product.categories && product.categories.length) {
                setSelectedCategories(product.categories as { id: number; name: string }[]);
                setValue('categoryIds', product.categories.map(c => c.id));
            }
            if (product.campaigns && product.campaigns.length) {
                setSelectedCampaigns(product.campaigns as { id: number; name: string }[]);
                setValue('campaignIds', product.campaigns.map(c => c.id));
            }
        }
    }, [product, reset, setValue]);

    // 2) Revogar preview anterior quando watchFile muda
    useEffect(() => {
        const file = watchFile as PreviewFile | undefined;

        return () => {
            if (file?.preview) {
                URL.revokeObjectURL(file.preview);
            }
        };
    }, [watchFile]);

    const secondaryFileKey = (f: File) => `${f.name}_${f.size}_${f.lastModified}`;

    // Revoke object URLs for secondary files when removed/replaced
    useEffect(() => {
        const prev = secondaryPrevRef.current;
        const current = watchSecondaryFiles ?? [];
        const currentKeys = new Set(current.map(secondaryFileKey));

        prev.forEach((f) => {
            if (f.preview && !currentKeys.has(secondaryFileKey(f))) {
                URL.revokeObjectURL(f.preview);
            }
        });

        secondaryPrevRef.current = current;
        setRemovedSecondaryUploads((old) => old.filter((k) => currentKeys.has(k)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchSecondaryFiles]);

    // On unmount, revoke any remaining previews
    useEffect(() => {
        return () => {
            secondaryPrevRef.current.forEach((f) => {
                if (f.preview) URL.revokeObjectURL(f.preview);
            });
            secondaryPrevRef.current = [];
        };
    }, []);

    const secondaryCounts = useMemo(() => {
        const all = watchSecondaryFiles ?? [];
        const removed = new Set(removedSecondaryUploads);
        const active = all.filter((f) => !removed.has(secondaryFileKey(f)));
        return { total: all.length, active: active.length };
    }, [watchSecondaryFiles, removedSecondaryUploads]);

    // compute final price for preview: use discount percentage only
    const watchedPrice = watch('price') as number | undefined;
    const watchedDiscount = watch('descontoPercentagem') as number | undefined;
    const finalPrice = computeFinalPrice(watchedPrice ?? 0, watchedDiscount);

    const createFormData = (items: FieldValues) => {
        const formData = new FormData();
        for (const key in items) {
            const value = items[key];
            if (value !== undefined && value !== null) {
                // These are handled explicitly to avoid duplicates and to support filtering removed uploads
                if (key === 'file' || key === 'secondaryFiles') continue;
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
            // Ensure any pending (typed) categories are created on the server before submitting
            const pendingCategories = selectedCategories.filter(c => typeof c === 'string').map(s => s as string);
            // include any typed-but-not-confirmed category from the input box
            const typed = categoryInput?.trim();
            if (typed && !pendingCategories.includes(typed) && !selectedCategories.some(c => typeof c !== 'string' && (c as Category).name === typed)) {
                pendingCategories.push(typed);
            }
            const existingCategoryIds = selectedCategories.filter(c => typeof c !== 'string').map(c => (c as Category).id);
            const finalCategoryIds: number[] = [...existingCategoryIds];
            if (pendingCategories && pendingCategories.length) {
                for (const name of pendingCategories) {
                    try {
                        const created = await createCategory({ name }).unwrap();
                        finalCategoryIds.push(created.id);
                        // replace the pending string in selectedCategories with the created object
                        setSelectedCategories(prev => prev.map(p => p === name ? created : p));
                        // clear typed input if matched
                        if (categoryInput && categoryInput === name) setCategoryInput('');
                    } catch (err) {
                        console.error('Failed to create category', err);
                        setError('categoryIds', { type: 'manual', message: 'Failed to create category. Check permissions.' });
                        return; // abort submit
                    }
                }
            }

            // ensure campaignIds are included (selectedCampaigns holds campaign objects)
            const existingCampaignIds = (selectedCampaigns ?? []).map(c => (c as { id: number }).id);
            const finalCampaignIds: number[] = [...existingCampaignIds];

            // build submission payload ensuring categoryIds/campaignIds contain the created/existing ids
            const submissionData = { ...data, categoryIds: finalCategoryIds, campaignIds: finalCampaignIds } as unknown as FieldValues;
            const formData = createFormData(submissionData);

            // ensure explicit sentinel keys are present when user cleared selections so the server
            // can detect an explicit update without model binding attempting to parse an empty string
            if (finalCampaignIds.length === 0) formData.append('campaignIds_present', '1');
            if (finalCategoryIds.length === 0) formData.append('categoryIds_present', '1');

            if (watchFile) {
                formData.append("file", watchFile);
            }

            // handle secondary files (multiple)
            const secondaryFiles = data.secondaryFiles as SecondaryPreviewFile[] | undefined;
            if (secondaryFiles && secondaryFiles.length) {
                const removed = new Set(removedSecondaryUploads);
                secondaryFiles
                    .filter((f) => !removed.has(secondaryFileKey(f)))
                    .forEach((f) => formData.append('secondaryFiles', f));
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
                Detalhes do Produto
            </Typography>
            <Typography variant="h6" sx={{ mb: 4 }}>
                {product ? 'Editar Produto' : 'Criar Novo Produto'}
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <AppTextInput control={control} name="name" label="Nome do Produto" />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        {/* show genero only when at least one selected category is 'Livro(s)' */}
                        {isBook(selectedCategories) && (
                            <AppSelectInput
                                items={genres}
                                control={control}
                                name="genero"
                                label="Género"
                                searchable
                            />
                        )}
                    </Grid>

                    {/* Categories multi-select */}
                    <Grid item xs={12}>
                        <Autocomplete
                            inputValue={categoryInput}
                            onInputChange={(_e, v) => setCategoryInput(v)}
                            multiple
                            freeSolo
                            options={(categories ?? []) as Category[]}
                            getOptionLabel={(option: Category | string) => typeof option === 'string' ? option : option.name}
                            value={selectedCategories}
                            onChange={(_event, value) => {
                                // value can contain Category objects or strings (freeSolo)
                                const vals = value ?? [];
                                const resolved: Array<Category | string> = [];
                                for (const v of vals) {
                                    if (typeof v === 'string') {
                                        // keep as pending (no id yet) — will create on submit
                                        resolved.push(v);
                                    } else {
                                        resolved.push(v as Category);
                                    }
                                }
                                setSelectedCategories(resolved);
                                // clear the input field when selection changes
                                setCategoryInput('');
                                // update form categoryIds only with existing numeric ids
                                setValue('categoryIds', resolved.filter(r => typeof r !== 'string').map(r => (r as Category).id));
                            }}
                            renderTags={(value: (Category | string)[], getTagProps) =>
                                value.map((option, index) => {
                                    const label = typeof option === 'string' ? option : option.name;
                                    const key = typeof option === 'string' ? label + index : option.id;
                                    return <Chip label={label} {...getTagProps({ index })} key={key} />
                                })
                            }
                            renderInput={(params) => (
                                <TextField {...params} label="Categorias" placeholder="Select or type to create" />
                            )}
                        />
                    </Grid>

                    {/* Campaigns multi-select */}
                    <Grid item xs={12}>
                        <Autocomplete
                            multiple
                            options={(campaigns ?? []) as Campaign[]}
                            getOptionLabel={(option: Campaign) => option.name}
                            value={selectedCampaigns}
                            onChange={(_, value: Campaign[] | null) => {
                                const vals = (value ?? []) as Campaign[];
                                setSelectedCampaigns(vals);
                                setValue('campaignIds', vals.map(v => v.id));
                            }}
                            renderTags={(value: Campaign[], getTagProps) =>
                                value.map((option, index) => (
                                    <Chip label={option.name} {...getTagProps({ index })} key={option.id} />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField {...params} label="Campanhas" placeholder="Select campaigns" />
                            )}
                        />
                    </Grid>

                    {/* Book-specific fields */}
                    {isBook(selectedCategories) && (
                        <>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="author" label="Autor" />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="secondaryAuthors" label="Autores secundários" />
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
                                <AppTextInput control={control} name="isbn" label="ISBN" />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="publisher" label="Editora" />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="edition" label="Edição" />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="precoPromocional" label="Preço Promocional" type="number" />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="synopsis" label="Sinopse" />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="index" label="Índice" />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="pageCount" label="Número de páginas" type="number" />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="language" label="Idioma" />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="format" label="Formato" />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="dimensoes" label="Dimensões" />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="weight" label="Weight" type="number" />
                            </Grid>
                        </>
                    )}

                    {/* Clothing / Toy fields: show when category looks like clothing or toy */}
                    {isClothingOrToy(selectedCategories) && (
                        <>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="cor" label="Cor / Color" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="material" label="Material" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="tamanho" label="Tamanho / Size" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="marca" label="Marca / Brand" />
                            </Grid>
                        </>
                    )}

                    {/* Tecnologia fields */}
                    {isTechnology(selectedCategories) && (
                        <>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="tipo" label="Tipo (ex.: Telemóvel, Portátil, Consola)" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="marca" label="Marca / Brand" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="modelo" label="Modelo" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="cor" label="Cor / Color" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="capacidade" label="Capacidade (ex.: 128GB, 1TB)" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="material" label="Material (opcional)" />
                            </Grid>
                        </>
                    )}

                    {/* Brinquedos fields */}
                    {isToy(selectedCategories) && (
                        <>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="marca" label="Marca / Brand" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="cor" label="Cor / Color" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="material" label="Material" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="idadeMinima" label="Idade mínima" type="number" />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <AppTextInput control={control} name="idadeMaxima" label="Idade máxima" type="number" />
                            </Grid>
                        </>
                    )}

                    <Grid item xs={12} md={6}>
                        <AppTextInput
                            type="number"
                            control={control}
                            name="price"
                            label="Preço"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <AppTextInput
                            type="number"
                            control={control}
                            name="descontoPercentagem"
                            label="Desconto (%)"
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
                            label="Quantidade em Stock"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <AppTextInput
                            control={control}
                            multiline
                            rows={4}
                            name="description"
                            label="Descrição"
                        />
                    </Grid>                           

                    <Grid item xs={12} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flex: 1, width: '100%' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Imagem principal
                            </Typography>
                            <AppDropzone name="file" control={control} />
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    Imagens secundárias (opcional)
                                </Typography>
                                <Button component="label" variant="outlined" size="small">
                                    Selecionar imagens
                                    <input
                                        type="file"
                                        hidden
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => {
                                            const files = e.target.files;
                                            if (files && files.length) {
                                                const existing = (watchSecondaryFiles ?? []) as SecondaryPreviewFile[];
                                                const existingByKey = new Map(existing.map(f => [secondaryFileKey(f), f] as const));
                                                const incoming = Array.from(files).map((f) => {
                                                    const key = secondaryFileKey(f);
                                                    if (existingByKey.has(key)) return existingByKey.get(key)!;
                                                    return Object.assign(f, { preview: URL.createObjectURL(f) }) as SecondaryPreviewFile;
                                                });
                                                const merged = [...existing, ...incoming].reduce<SecondaryPreviewFile[]>((acc, f) => {
                                                    const key = secondaryFileKey(f);
                                                    if (!acc.some(x => secondaryFileKey(x) === key)) acc.push(f);
                                                    return acc;
                                                }, []);

                                                setValue('secondaryFiles', merged as unknown as CreateProductSchema['secondaryFiles'], {
                                                    shouldDirty: true,
                                                    shouldTouch: true,
                                                });
                                                // allow selecting the same file again later
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }}
                                    />
                                </Button>

                                {secondaryCounts.total > 0 && (
                                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                        Selecionadas: {secondaryCounts.total} (ativas: {secondaryCounts.active})
                                    </Typography>
                                )}

                                {watchSecondaryFiles && watchSecondaryFiles.length > 0 && (
                                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {watchSecondaryFiles.map((f) => {
                                            const key = secondaryFileKey(f);
                                            const removed = removedSecondaryUploads.includes(key);
                                            return (
                                                <Box key={key} sx={{ position: 'relative' }}>
                                                    <img
                                                        src={f.preview}
                                                        alt={f.name}
                                                        style={{
                                                            width: 120,
                                                            height: 80,
                                                            objectFit: 'cover',
                                                            borderRadius: 4,
                                                            opacity: removed ? 0.4 : 1,
                                                        }}
                                                    />
                                                    <Button
                                                        size="small"
                                                        color={removed ? 'inherit' : 'error'}
                                                        onClick={() => {
                                                            setRemovedSecondaryUploads((prev) => {
                                                                if (prev.includes(key)) return prev.filter((x) => x !== key);
                                                                return [...prev, key];
                                                            });
                                                        }}
                                                        sx={{ position: 'absolute', top: 4, right: 4, minWidth: 0, px: 1 }}
                                                    >
                                                        {removed ? 'Undo' : 'Remove'}
                                                    </Button>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                )}
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
                        Cancelar
                    </Button>

                    <LoadingButton
                        loading={isSubmitting}
                        variant="contained"
                        color="success"
                        type="submit"
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        Enviar
                    </LoadingButton>
                </Box>
            </form>
        </Box>
    );
}
