export type ProductParams = {
    orderBy: string;
    searchTerm?: string;
    generos?: string[];
    anos?: number[];
    pageNumber: number;
    pageSize: number;
}