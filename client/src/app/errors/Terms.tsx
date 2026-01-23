import { Box, Typography, Container } from "@mui/material";

export default function Terms() {
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
                Termos e Condições
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>1. Aceitação dos Termos</Typography>
                    <Typography>
                        Ao aceder e utilizar este website, aceita estar vinculado por estes Termos e Condições. 
                        Se não concorda com alguma parte destes termos, por favor não use este website.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>2. Licença de Uso</Typography>
                    <Typography>
                        Concedemos a você uma licença limitada e não exclusiva para acessar e usar este website 
                        para fins pessoais e não comerciais, sujeito aos termos e condições estabelecidos aqui.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>3. Produtos e Serviços</Typography>
                    <Typography>
                        Descrevemos os nossos produtos com o cuidado máximo. No entanto, não garantimos a precisão, 
                        completude ou atualidade da informação de produtos.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>4. Preços</Typography>
                    <Typography>
                        Reservamo-nos o direito de alterar preços a qualquer momento. Os preços válidos são os 
                        apresentados no momento da compra.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>5. Encomendas</Typography>
                    <Typography>
                        Todas as encomendas estão sujeitas à nossa aceitação. Reservamo-nos o direito de recusar 
                        ou cancelar qualquer encomenda.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>6. Pagamento</Typography>
                    <Typography>
                        O pagamento deve ser efetuado nos termos especificados durante o processo de compra. 
                        Todas as transações são seguras e criptografadas.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>7. Isenção de Responsabilidade</Typography>
                    <Typography>
                        Este website é fornecido "tal como está", sem garantias de qualquer tipo. 
                        Não somos responsáveis por qualquer dano indireto, incidental ou consequente.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>8. Lei Aplicável</Typography>
                    <Typography>
                        Estes Termos e Condições são regidos pela legislação Portuguesa e estão sujeitos à 
                        jurisdição exclusiva dos tribunais portugueses.
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
}
