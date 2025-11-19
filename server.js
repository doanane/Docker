const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Simple API that returns dynamic data
app.get('/api/data', (req, res) => {
    res.json({
        message: "Hello from Node.js server!",
        timestamp: new Date().toISOString(),
        visitorCount: Math.floor(Math.random() * 1000) + 1,
        serverStatus: "Running smoothly"
    });
});

// Endpoint to update profile (simulated)
app.get('/api/update', (req, res) => {
    const newName = req.query.name || "Updated Name";
    const newTitle = req.query.title || "Updated Title";
    
    res.json({
        success: true,
        message: "Profile updated successfully!",
        updatedData: {
            name: newName,
            title: newTitle,
            updatedAt: new Date().toISOString()
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Try visiting: http://localhost:${PORT}/api/data`);
});