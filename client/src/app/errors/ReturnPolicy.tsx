import { Box, Typography, Container } from "@mui/material";
import PageTitle from "../shared/components/PageTitle";

export default function ReturnPolicy() {
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <PageTitle title="Política de Devoluções" variant="h4" />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>1. Direito de Devolução</Typography>
                    <Typography>
                        Tem o direito de devolver produtos dentro de 30 dias após a compra, desde que estejam em 
                        perfeitas condições, com a embalagem original e acompanhados pelo comprovativo de compra.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>2. Processamento de Devoluções</Typography>
                    <Typography>
                        Para iniciar uma devolução, contacte-nos com o número da sua encomenda. Forneceremos 
                        instruções sobre como devolver o produto.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>3. Custos de Envio</Typography>
                    <Typography>
                        Os custos de envio originais não são reembolsáveis. Se o produto for devolvido por 
                        culpa nossa (defeito, dano ou erro), nós cobrimos os custos de devolução.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>4. Reembolsos</Typography>
                    <Typography>
                        Após recebermos e inspecionarmos o produto devolvido, processaremos o reembolso dentro 
                        de 5-10 dias úteis. O reembolso será feito para a mesma forma de pagamento utilizada.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>5. Produtos Não Devolvíveis</Typography>
                    <Typography>
                        Alguns produtos, como livros já lidos, não podem ser devolvidos por razões de higiene e segurança.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>6. Trocas</Typography>
                    <Typography>
                        Se desejar trocar um produto por outro, contacte-nos e será um prazer ajudá-lo. 
                        Aplicam-se as mesmas condições que para devoluções.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>7. Contacto para Devoluções</Typography>
                    <Typography>
                        Para qualquer questão sobre devoluções, entre em contacto conosco através do email 
                        fornecido na página de Contactos.
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
}
