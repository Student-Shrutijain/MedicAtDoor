import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import User from './models/User.js';

const testDB = async () => {
    try {
        console.log("⏳ 1. Connecting to MongoDB Atlas...");
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("✅ Successfully connected to MongoDB Atlas!");

        console.log("\n⏳ 2. Pre-cleaning any previous test user...");
        await User.deleteOne({ email: 'test_seed@example.com' });

        console.log("\n⏳ 3. Testing User Registration (Database Save)...");
        const newUser = new User({
            name: "Seed Test User",
            email: "test_seed@example.com",
            password: "testpassword123",
            role: "Patient"
        });

        const savedUser = await newUser.save();
        console.log("✅ Successfully created new test user in the database!");
        console.log("   - User ID:", savedUser._id);
        console.log("   - Email:", savedUser.email);

        console.log("\n⏳ 4. Testing User lookup (findOne)...");
        const foundUser = await User.findOne({ email: 'test_seed@example.com' });
        if (foundUser) {
            console.log("✅ Successfully retrieved test user from the database!");
        } else {
            console.log("❌ Failed to find the created user.");
        }

        console.log("\n⏳ 5. Cleaning up (Deleting test user)...");
        await User.deleteOne({ email: 'test_seed@example.com' });
        console.log("✅ Test cleanup complete.");
        
    } catch (error) {
        console.error("\n❌ TEST FAILED:", error.message);
        if (error.name === 'MongooseServerSelectionError') {
             console.error("-> It looks like MongoDB is blocking the connection! Please carefully check Network Access (0.0.0.0/0) in Atlas.");
        }
    } finally {
        await mongoose.connection.close();
        console.log("\n🏁 Test execution finished.");
        process.exit(0);
    }
};

testDB();
