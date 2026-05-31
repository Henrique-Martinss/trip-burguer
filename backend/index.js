require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const app = express();
app.use(cors());
app.use(express.json());

// Configurar o client do Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-TOKEN' });
const payment = new Payment(client);

app.post('/api/pix/create', async (req, res) => {
    try {
        const { description, transaction_amount, email } = req.body;

        if (!transaction_amount) {
            return res.status(400).json({ error: 'O valor da transação é obrigatório.' });
        }

        const paymentData = {
            body: {
                transaction_amount: parseFloat(transaction_amount),
                description: description || 'Pedido Trip Burger',
                payment_method_id: 'pix',
                payer: {
                    email: email || 'cliente@tripburger.com',
                },
            }
        };

        const result = await payment.create(paymentData);

        const pixData = result.point_of_interaction?.transaction_data;

        if (!pixData) {
            throw new Error('Dados do PIX não retornaram da API.');
        }

        return res.json({
            qr_code: pixData.qr_code, // Código copia e cola
            qr_code_base64: pixData.qr_code_base64, // Imagem base64
            payment_id: result.id
        });

    } catch (error) {
        console.error('Erro ao gerar Pix:', error);
        return res.status(500).json({ error: 'Erro ao gerar pagamento PIX.' });
    }
});

// Verificar status de um pagamento PIX
app.get('/api/pix/status/:payment_id', async (req, res) => {
    try {
        const { payment_id } = req.params;
        const result = await payment.get({ id: payment_id });
        return res.json({
            status: result.status,           // 'pending', 'approved', 'cancelled', 'rejected'
            status_detail: result.status_detail
        });
    } catch (error) {
        console.error('Erro ao verificar status PIX:', error);
        return res.status(500).json({ error: 'Erro ao verificar pagamento.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend PIX rodando na porta ${PORT}`);
});
