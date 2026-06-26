const mongoose = require('mongoose');

const uri = 'mongodb+srv://diu_admin:qgIysaCYgdfShy6V@diumicrojobs.1mxcoqf.mongodb.net/diu-microjobs?retryWrites=true&w=majority&appName=DiuMicroJobs';

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    const db = mongoose.connection.db;

    const universities = await db.collection('universities').find({}).toArray();
    console.log(`Total universities in database: ${universities.length}`);
    for (const uni of universities) {
      const userCount = await db.collection('users').countDocuments({ university: uni._id });
      const jobCount = await db.collection('jobs').countDocuments({ university: uni._id });
      console.log(`University: ${uni.name} (${uni.shortName}) - Users: ${userCount}, Jobs: ${jobCount}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
