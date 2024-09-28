import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import User, { IUserDocument } from '../../models/user.model';
import { AudioSample } from '../../models/audio-sample.model';
import DefaultAudioSample from '../../models/audio-sample-default.model';
import UserAudioSample from '../../models/audio-sample-user.model';
import Collection from '../../models/collection.model';
import environment from '../../config/environment';

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function createUsers(): Promise<IUserDocument[]> {
  const users: IUserDocument[] = [];

  // Create admin user
  const adminUser = new User({
    username: 'admin',
    email: 'admin@example.com',
    password: await hashPassword('adminpassword'),
    isVerified: true,
    role: 'admin'
  });
  users.push(await adminUser.save());

  // Create normal users
  const normalUsers = [
    { username: 'techieturtle', email: 'techie@eg.com', hasProfilePic: true },
    { username: 'pixelpioneer', email: 'pixel@eg.com', hasProfilePic: false },
    { username: 'codemaven', email: 'code@eg.com', hasProfilePic: true },
    { username: 'bytebandit', email: 'byte@eg.com', hasProfilePic: false },
    { username: 'quantumquest', email: 'quantum@eg.com', hasProfilePic: true }
  ];

  for (const userData of normalUsers) {
    const user = new User({
      username: userData.username,
      email: userData.email,
      password: await hashPassword('userpassword'),
      isVerified: true,
      role: 'user'
    });

    if (userData.hasProfilePic) {
      const profilePicFile = await fs.readFile(path.join(__dirname, `populatedb/profilepic/${userData.username}.jpg`));
      const profilePicFileName = `${uuidv4()}.jpg`;
      await fs.writeFile(path.join(__dirname, `uploads/profile-picture/${profilePicFileName}`), profilePicFile);
      user.profilePicture = `/uploads/profile-picture/${profilePicFileName}`;
    }

    users.push(await user.save());
  }

  return users;
}

async function createDefaultSamples(): Promise<void> {
  const sampleFiles = await fs.readdir(path.join(__dirname, 'populatedb/samples'));
  
  for (const file of sampleFiles) {
    const name = path.parse(file).name;
    const audioFile = await fs.readFile(path.join(__dirname, `populatedb/samples/${file}`));
    const iconFile = await fs.readFile(path.join(__dirname, `populatedb/icons/${name}.png`));
    
    const audioFileName = `${uuidv4()}${path.extname(file)}`;
    const iconFileName = `${uuidv4()}.png`;
    
    await fs.writeFile(path.join(__dirname, `uploads/audio/default/${audioFileName}`), audioFile);
    await fs.writeFile(path.join(__dirname, `uploads/icons/default/${iconFileName}`), iconFile);
    
    const defaultSample = new DefaultAudioSample({
      name,
      audioUrl: `/uploads/audio/default/${audioFileName}`,
      iconUrl: `/uploads/icons/default/${iconFileName}`,
      forMainPage: Math.random() < 0.5 // 50% chance to be on main page
    });
    
    await defaultSample.save();
  }
}

async function createUserSamples(users: IUserDocument[]): Promise<void> {
  const normalUsers = users.filter(user => user.role === 'user');
  
  for (const user of normalUsers) {
    const numSamples = Math.floor(Math.random() * 3) + 3; // 3-5 samples per user
    
    for (let i = 0; i < numSamples; i++) {
      const name = `${user.username}_sample_${i + 1}`;
      const audioFileName = `${uuidv4()}.mp3`;
      const iconFileName = `${uuidv4()}.png`;
      
      // In a real scenario, you'd have actual audio and icon files. Here we're just creating placeholders.
      await fs.writeFile(path.join(__dirname, `uploads/audio/user/${audioFileName}`), 'audio content');
      await fs.writeFile(path.join(__dirname, `uploads/icons/user/${iconFileName}`), 'icon content');
      
      const userSample = new UserAudioSample({
        user: user._id,
        name,
        audioUrl: `/uploads/audio/user/${audioFileName}`,
        iconUrl: `/uploads/icons/user/${iconFileName}`
      });
      
      await userSample.save();
    }
  }
}

async function createCustomCollections(users: IUserDocument[]): Promise<void> {
  const normalUsers = users.filter(user => user.role === 'user');
  
  for (const user of normalUsers) {
    const defaultSamples = await DefaultAudioSample.find().limit(3);
    const userSamples = await UserAudioSample.find({ user: user._id }).limit(2);
    
    const collection = new Collection({
      user: user._id,
      name: `${user.username}'s Collection`,
      samples: [...defaultSamples.map(s => s._id), ...userSamples.map(s => s._id)]
    });
    
    await collection.save();
  }
}

async function populateDB(): Promise<void> {
  try {
    await mongoose.connect(environment.database.uri);
    console.log('Connected to MongoDB');

    // Check if database is already populated
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database is already populated. Skipping population process.');
      return;
    }

    const users = await createUsers();
    await createDefaultSamples();
    await createUserSamples(users);
    await createCustomCollections(users);

    console.log('Database populated successfully');
  } catch (error) {
    console.error('Error populating database:', error);
  } finally {
    await mongoose.disconnect();
  }
}

populateDB();