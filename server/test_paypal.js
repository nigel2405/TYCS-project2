import 'dotenv/config';
import paypal from '@paypal/checkout-server-sdk';

const environment = new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
const client = new paypal.core.PayPalHttpClient(environment);

async function test() {
    console.log("Testing with USD...");
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'USD',
                value: '10.00'
            }
        }]
    });

    try {
        const order = await client.execute(request);
        console.log('Success:', order.result.id);
    } catch (err) {
        console.error('Error status:', err.statusCode);
        console.error('Error message:', err.message);
        // Try parsing JSON if present
        try {
            console.error('Error details:', JSON.parse(err.message));
        } catch (e) {
            console.error('Raw string:', err.message);
        }
    }
}

test();
