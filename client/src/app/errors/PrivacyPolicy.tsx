import { Box, Typography, Container } from "@mui/material";

export default function PrivacyPolicy() {
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
                Política de Privacidade
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>1. Informação Geral</Typography>
                    <Typography>
                        A sua privacidade é importante para nós. Esta Política de Privacidade explica como recolhemos, 
                        utilizamos, divulgamos e mantemos seguro as suas informações pessoais.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>2. Informações que Recolhemos</Typography>
                    <Typography>
                        Recolhemos informações que fornece diretamente, como quando cria uma conta, coloca uma encomenda, 
                        ou contacta-nos. Estas podem incluir:
                    </Typography>
                    <ul>
                        <li>Nome, email e telefone</li>
                        <li>Endereço de faturação e envio</li>
                        <li>Informações de pagamento</li>
                        <li>Histórico de compras</li>
                    </ul>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>3. Como Utilizamos Suas Informações</Typography>
                    <Typography>
                        Utilizamos as suas informações para:
                    </Typography>
                    <ul>
                        <li>Processar encomendas</li>
                        <li>Fornecer atendimento ao cliente</li>
                        <li>Enviar comunicações sobre a sua conta</li>
                        <li>Melhorar nossos serviços</li>
                        <li>Cumprir obrigações legais</li>
                    </ul>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>4. Segurança</Typography>
                    <Typography>
                        Implementamos medidas de segurança apropriadas para proteger suas informações pessoais contra 
                        acesso não autorizado, alteração, divulgação ou destruição.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>5. Direitos dos Utilizadores</Typography>
                    <Typography>
                        Tem o direito de aceder, corrigir ou solicitar a eliminação de seus dados pessoais. 
                        Para exercer estes direitos, contacte-nos através do email fornecido.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>6. Cookies</Typography>
                    <Typography>
                        Usamos cookies para melhorar a sua experiência. Pode gerir suas preferências de cookies 
                        através das definições do seu navegador.
                    </Typography>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>7. Alterações a Esta Política</Typography>
                    <Typography>
                        Podemos atualizar esta Política de Privacidade periodicamente. A data da última atualização 
                        será indicada no topo da página.
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
}
