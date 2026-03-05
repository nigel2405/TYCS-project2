import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import GPU from './models/GPU.js';

async function checkData() {
    await mongoose.connect(process.env.MONGO_URI);

    // Check Consumer Wallet
    const consumers = await User.find({ role: 'consumer' });
    console.log('--- CONSUMERS ---');
    consumers.forEach(c => console.log(`${c.username} | Wallet: $${c.walletBalance}`));

    // Check GPUs
    const gpus = await GPU.find().populate('provider');
    console.log('\n--- GPUs ---');
    gpus.forEach(g => {
        console.log(`${g.name} | Price: $${g.pricePerHour} | Available: ${g.isAvailable} | Active: ${g.isActive} | Session: ${g.currentSession}`);
        if (g.provider) {
            console.log(`  -> Provider: ${g.provider.username} | Approved: ${g.provider.isProviderApproved}`);
        }
    });

    await mongoose.disconnect();
}

checkData().catch(console.error);
