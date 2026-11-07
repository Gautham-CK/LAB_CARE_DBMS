
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Test backend
app.get('/', (req, res) => {
    res.send('LabCare Backend is Running!');
});

// Register a user
app.post('/api/users', async (req, res) => {
    try {
        const { name, email, phone, role, department } = req.body;

        if (!name || !email || !role) {
            return res.status(400).json({
                error: 'Name, email and role are required'
            });
        }

        const { data, error } = await supabase
            .from('labcare_user')
            .insert([
                {
                    name,
                    email,
                    phone: phone || null,
                    role,
                    department: department || null
                }
            ])
            .select()
            .single();

        if (error) {
            return res.status(400).json({
                error: error.message
            });
        }

        res.status(201).json({
            message: 'User registered successfully!',
            user: data
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// Start server
app.listen(5000, () => {
    console.log('Server running on port 5000');
});
