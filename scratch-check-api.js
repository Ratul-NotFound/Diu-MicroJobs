const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://diu_admin:qgIysaCYgdfShy6V@diumicrojobs.1mxcoqf.mongodb.net/diu-microjobs?retryWrites=true&w=majority&appName=DiuMicroJobs';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    icon: { type: String, default: "briefcase" },
    description: { type: String, default: "" },
    jobCount: { type: Number, default: 0 },
    subcategories: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  }
);

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

async function run() {
  try {
    console.log('Connecting to:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database.');

    const categories = await Category.find({ isActive: { $ne: false } })
      .sort({ order: 1 })
      .lean();

    console.log(`Total categories fetched via API logic: ${categories.length}`);
    console.log('Categories:', JSON.stringify(categories, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
