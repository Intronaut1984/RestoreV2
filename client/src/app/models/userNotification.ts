export type UserNotification = {
    id: number;
    title: string;
    message: string;
    url?: string | null;
    createdAt: string;
    isRead: boolean;
};
