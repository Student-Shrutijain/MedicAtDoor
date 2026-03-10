import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
console.log('Testing connection to:', uri.replace(/:.*@/, ':****@'));

mongoose.connect(uri)
    .then(async () => {
        console.log('SUCCESS: Connected to MongoDB Atlas');

        const Doctor = mongoose.model('Doctor', new mongoose.Schema({}));
        const Medicine = mongoose.model('Medicine', new mongoose.Schema({}));

        const drCount = await Doctor.countDocuments();
        const medCount = await Medicine.countDocuments();

        console.log(`Doctors in DB: ${drCount}`);
        console.log(`Medicines in DB: ${medCount}`);

        process.exit(0);
    })
    .catch(err => {
        console.error('FAILURE: Could not connect to MongoDB Atlas');
        console.error(err);
        process.exit(1);
    });
