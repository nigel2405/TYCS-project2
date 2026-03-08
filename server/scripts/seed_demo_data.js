import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import GPU from '../models/GPU.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        // Force IPv4 loopback
        const uri = process.env.MONGODB_URI.replace('localhost', '127.0.0.1');
        console.log('Connecting to MongoDB at:', uri);
        await mongoose.connect(uri);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
}

const seedData = async () => {
    try {
        console.log('Starting seed process...');
        await connectDB();

        // 1. Create Demo Provider
        let provider = await User.findOne({ email: 'provider@demo.com' });
        if (!provider) {
            provider = await User.create({
                username: 'DemoProvider',
                email: 'provider@demo.com',
                password: 'password123',
                role: 'provider',
                isProviderApproved: true,
                walletBalance: 0
            });
            console.log('Created Demo Provider: provider@demo.com / password123');
        } else {
            console.log('Demo Provider already exists');
        }

        // 2. Create Demo Consumer
        let consumer = await User.findOne({ email: 'consumer@demo.com' });
        if (!consumer) {
            consumer = await User.create({
                username: 'DemoConsumer',
                email: 'consumer@demo.com',
                password: 'password123',
                role: 'consumer',
                walletBalance: 100
            });
            console.log('Created Demo Consumer: consumer@demo.com / password123 (Balance: $100)');
        } else {
            consumer.walletBalance = 100;
            await consumer.save();
            console.log('Demo Consumer exists. Reset balance to $100.');
        }

        // 3. Create Demo GPU
        let gpu = await GPU.findOne({ name: 'Demo RTX 4090' });
        if (!gpu) {
            gpu = await GPU.create({
                name: 'Demo RTX 4090',
                manufacturer: 'NVIDIA',
                model: 'RTX 4090',
                vram: 24,
                clockSpeed: 2520,
                pricePerHour: 1.5,
                provider: provider._id,
                isAvailable: true
            });
            console.log('Created Demo GPU: "Demo RTX 4090"');
        } else {
            console.log('Demo GPU already exists.');
        }

        console.log('\n=============================================');
        console.log('       SEEDING COMPLETE - COPY THIS ID');
        console.log('=============================================');
        console.log(`PROVIDER_ID=${provider._id.toString()}`);
        console.log('=============================================\n');

        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
