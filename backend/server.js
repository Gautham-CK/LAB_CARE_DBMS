const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check (the frontend calls GET / to see if the backend is alive)
app.get('/', (req, res) => {
  res.send('LabCare Backend is Running!');
});

// ---- REST API routes (one file per table) ----
app.use('/api/users', require('./routes/users'));
app.use(['/api/labs', '/api/laboratories'], require('./routes/labs'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/repairs', require('./routes/repairs'));
app.use(['/api/maintenance', '/api/maintenance-logs'], require('./routes/maintenance'));
app.use('/api/reports', require('./routes/reports'));

// Unknown route
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Safety net for unexpected crashes
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
