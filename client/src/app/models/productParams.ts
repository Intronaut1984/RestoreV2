export type ProductParams = {
    orderBy: string;
    searchTerm?: string;
    generos?: string[];
    anos?: number[];
    categoryIds?: number[];
    campaignIds?: number[];
    marcas?: string[];
    modelos?: string[];
    tipos?: string[];
    capacidades?: string[];
    cores?: string[];
    materiais?: string[];
    tamanhos?: string[];
    hasDiscount?: boolean;
    pageNumber: number;
    pageSize: number;
}