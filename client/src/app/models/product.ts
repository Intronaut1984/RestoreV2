export type Product = {
    id: number
    name: string
    description: string
    price: number
    pictureUrl: string
    // removed 'type' and 'brand' — replaced with book-specific fields
    genero?: string
    anoPublicacao?: number
    quantityInStock: number
    // optional fields returned by the API
    subtitle?: string | null
    author?: string | null
    secondaryAuthors?: string | null
    isbn?: string | null
    publisher?: string | null
    edition?: string | null
    promotionalPrice?: number | null
    discountPercentage?: number | null
    synopsis?: string | null
    index?: string | null
    pageCount?: number | null
    language?: string | null
    format?: string | null
    dimensoes?: string | null
    weight?: number | null
    secondaryImages?: string[] | null
    secondaryImagePublicIds?: string[] | null
    // clothing / toy specific
    cor?: string | null
    material?: string | null
    tamanho?: string | null
    marca?: string | null
    // metadata
    averageRating?: number | null
    ratingsCount?: number | null
    createdAt?: string | null
    updatedAt?: string | null
    active?: boolean | null
    tags?: string[]
    publicId?: string | null
    categories?: { id: number; name: string }[] | null
    campaigns?: { id: number; name: string }[] | null
}