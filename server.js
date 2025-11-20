const express = require('express');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const PORT = 3000;

// MongoDB connection URI - using the one from your mongo-express
const MONGODB_URI = 'mongodb://admin:password@localhost:27017/';
const DB_NAME = 'portfolio';
const COLLECTION_NAME = 'profile';

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // For parsing JSON bodies

// MongoDB connection
let db;

async function connectToDatabase() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log('✅ Connected to MongoDB successfully');
        
        // Create initial profile if it doesn't exist
        await initializeProfile();
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
    }
}

async function initializeProfile() {
    const collection = db.collection(COLLECTION_NAME);
    const existingProfile = await collection.findOne({ type: 'main' });
    
    if (!existingProfile) {
        const initialProfile = {
            type: 'main',
            name: "Alex Johnson",
            title: "Full Stack Developer",
            location: "New York, USA",
            email: "alex.johnson@email.com",
            experience: "3+ years",
            skills: ["JavaScript", "Node.js", "React", "Python", "Docker", "MongoDB"],
            projects: [
                { 
                    id: new ObjectId(), 
                    name: "E-Commerce Platform", 
                    description: "Full-stack e-commerce solution with React and Node.js" 
                },
                { 
                    id: new ObjectId(), 
                    name: "Task Management App", 
                    description: "Real-time task management application" 
                }
            ],
            bio: "Passionate developer creating amazing web experiences. Currently learning Docker and advanced backend technologies.",
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await collection.insertOne(initialProfile);
        console.log('✅ Initial profile created in database');
    }
}

// Connect to database when server starts
connectToDatabase();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get portfolio data from MongoDB
app.get('/api/portfolio', async (req, res) => {
    try {
        const collection = db.collection(COLLECTION_NAME);
        const profile = await collection.findOne({ type: 'main' });
        
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        
        res.json(profile);
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update profile in MongoDB (persistent)
app.post('/api/update-profile', async (req, res) => {
    try {
        const { name, title, location, email, bio, skills } = req.body;
        const collection = db.collection(COLLECTION_NAME);
        
        const updateData = {
            $set: {
                ...(name && { name }),
                ...(title && { title }),
                ...(location && { location }),
                ...(email && { email }),
                ...(bio && { bio }),
                ...(skills && { skills }),
                updatedAt: new Date()
            }
        };
        
        const result = await collection.updateOne(
            { type: 'main' },
            updateData
        );
        
        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Profile not found or no changes made' });
        }
        
        res.json({
            success: true,
            message: 'Profile updated successfully in database!',
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add a new project
app.post('/api/projects', async (req, res) => {
    try {
        const { name, description } = req.body;
        const collection = db.collection(COLLECTION_NAME);
        
        const newProject = {
            id: new ObjectId(),
            name,
            description,
            createdAt: new Date()
        };
        
        const result = await collection.updateOne(
            { type: 'main' },
            { $push: { projects: newProject } }
        );
        
        res.json({
            success: true,
            message: 'Project added successfully!',
            project: newProject
        });
    } catch (error) {
        console.error('Error adding project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get visitor count (with persistence)
app.get('/api/visitor-count', async (req, res) => {
    try {
        const collection = db.collection('visitors');
        const visitorData = await collection.findOne({ type: 'counter' });
        
        let count = 1;
        if (visitorData) {
            count = visitorData.count + 1;
            await collection.updateOne(
                { type: 'counter' },
                { $set: { count, lastVisit: new Date() } }
            );
        } else {
            await collection.insertOne({
                type: 'counter',
                count: 1,
                lastVisit: new Date()
            });
        }
        
        res.json({ visitorCount: count });
    } catch (error) {
        console.error('Error updating visitor count:', error);
        res.json({ visitorCount: 1 }); // Fallback
    }
});

// Health check with DB status
app.get('/api/health', async (req, res) => {
    try {
        const collection = db.collection(COLLECTION_NAME);
        await collection.findOne({ type: 'main' });
        
        res.json({
            status: 'OK',
            database: 'Connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            database: 'Disconnected',
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Portfolio API: http://localhost:${PORT}/api/portfolio`);
    console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
});