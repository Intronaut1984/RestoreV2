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
}