export type Campaign = {
    id: number;
    name: string;
    slug?: string | null;
    isActive?: boolean;
    description?: string | null;
    imageUrl?: string | null;
}
