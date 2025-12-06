import { z } from "zod";

export const loginSchema = z.object({
    identifier: z.string().min(1, { message: 'Username ou email é obrigatório' }),
    password: z.string().min(6, {
        message: 'A password deve ter pelo menos 6 caracteres'
    })
});

export type LoginSchema = z.infer<typeof loginSchema>;