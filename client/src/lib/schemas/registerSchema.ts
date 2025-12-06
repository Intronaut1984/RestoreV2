import { z } from "zod";

const passwordValidation = new RegExp(
    /(?=^.{6,10}$)(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&amp;*()_+}{&quot;:;'?/&gt;.&lt;,])(?!.*\s).*$/
)

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().regex(passwordValidation, {
        message: 'A Password deve ter pelo menos um caractere minúsculo, 1 caractere maiúsculo, 1 número, 1 caractere especial e ter entre 6-10 caracteres'
    })
});

export type RegisterSchema = z.infer<typeof registerSchema>;