import { z } from "zod";

const fileSchema = z.instanceof(File).refine(file => file.size > 0, {
    message: 'A file must be uploaded'
}).transform(file => ({
    ...file,
    preview: URL.createObjectURL(file)
}))

export const createProductSchema = z.object({
    name: z.string({required_error: 'Name of product is required'}),
    description: z.string({required_error: 'Description is required'}).min(10, {
        message: 'Description must be at least 10 characters'
    }),
    price: z.coerce.number({required_error: 'Price is required'})
        .min(100, 'Price must be at least €1.00'),
    subtitle: z.string().optional(),
    author: z.string().optional(),
    secondaryAuthors: z.string().optional(),
    isbn: z.string().optional(),
    publisher: z.string().optional(),
    edition: z.string().optional(),
    anoPublicacao: z.coerce.number().optional(),
    genero: z.string().optional(),
    precoPromocional: z.coerce.number().optional(),
    descontoPercentagem: z.coerce.number().optional(),
    quantityInStock: z.coerce.number({required_error: 'Quantity is required'})
        .min(1, 'Quantity must be at least 1'),
    pictureUrl: z.string().optional(),
    file: fileSchema.optional(),
    // allow multiple secondary files to be attached at creation
    secondaryFiles: z.array(z.instanceof(File)).optional(),
    campaignIds: z.array(z.number()).optional(),
    categoryIds: z.array(z.number()).optional(),
    synopsis: z.string().optional(),
    index: z.string().optional(),
    pageCount: z.coerce.number().optional(),
    language: z.string().optional(),
    format: z.string().optional(),
    dimensoes: z.string().optional(),
    weight: z.coerce.number().optional(),
    // clothing / toy specific fields
    cor: z.string().optional(),
    material: z.string().optional(),
    tamanho: z.string().optional(),
    marca: z.string().optional(),
    tags: z.array(z.string()).optional()
}).refine((data) => data.pictureUrl || data.file, {
    message: 'Please provide an image',
    path: ['file']
})

export type CreateProductSchema = z.infer<typeof createProductSchema>;