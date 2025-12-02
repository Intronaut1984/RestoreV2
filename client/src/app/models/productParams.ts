export type ProductParams = {
    orderBy: string;
    searchTerm?: string;
    generos?: string[];
    anos?: number[];
    categoryIds?: number[];
    campaignIds?: number[];
    hasDiscount?: boolean;
    pageNumber: number;
    pageSize: number;
}