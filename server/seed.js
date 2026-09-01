require('dotenv').config();
const mongoose = require('mongoose');
const auth = require('./auth');
const { User } = require('./database');

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cargo_invoice';
  console.log(`[MongoDB] Connecting to ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}...`);
  
  await mongoose.connect(uri);
  console.log(`[MongoDB] Connected to database: ${mongoose.connection.name}`);

  const defaultUsers = [
    {
      username: 'admin',
      full_name: 'Administrator',
      password: 'admin123',
    },
    {
      username: 'operator',
      full_name: 'Invoice Operator',
      password: 'operator123',
    },
    {
      username: 'accounts',
      full_name: 'Accounts Manager',
      password: 'accounts123',
    },
    {
      username: 'operations',
      full_name: 'Freight Operations Lead',
      password: 'operations123',
    },
  ];

  console.log('\n--- Seeding Users ---');
  for (const item of defaultUsers) {
    const existing = await User.findOne({ username: item.username });
    const password_hash = auth.hashPassword(item.password);

    if (!existing) {
      await User.create({
        username: item.username,
        full_name: item.full_name,
        password_hash,
        created_at: Date.now() / 1000,
      });
      console.log(`✓ Created:  ${item.username.padEnd(12)} (${item.full_name}) | Password: ${item.password}`);
    } else {
      existing.full_name = item.full_name;
      existing.password_hash = password_hash;
      await existing.save();
      console.log(`✓ Verified: ${item.username.padEnd(12)} (${item.full_name}) | Password: ${item.password}`);
    }
  }

  const usersCount = await User.countDocuments();
  console.log(`\nTotal users in collection: ${usersCount}`);

  await mongoose.disconnect();
  console.log('[MongoDB] Disconnected successfully.\n');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
