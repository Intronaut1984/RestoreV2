export type ProductParams = {
    orderBy: string;
    searchTerm?: string;
    generos?: string[];
    anos?: number[];
    categoryIds?: number[];
    campaignIds?: number[];
    pageNumber: number;
    pageSize: number;
}