require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./db');
const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',').map(s=>s.trim()) : true }));
app.use(express.json({limit:'1mb'}));
app.use('/api/auth', rateLimit({windowMs:15*60*1000,limit:100,standardHeaders:true,legacyHeaders:false}));
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');

        res.json({
            success: true,
            status: 'ok',
            database: 'connected'
        });

    } catch (err) {
        console.error('Database health check failed:', err);

        res.status(503).json({
            success: false,
            status: 'degraded',
            database: 'unavailable'
        });
    }
});
app.use('/api/auth',require('./routes/auth'));
app.use('/api/jobs',require('./routes/jobs'));
app.use('/api/applications',require('./routes/applications'));
app.use('/api/workers',require('./routes/profiles'));
app.use('/api/reports',require('./routes/reports'));
app.use('/api/wages',require('./routes/wages'));
app.use('/api/reviews',require('./routes/reviews'));
app.use((req,res)=>res.status(404).json({error:'API route not found.'}));
app.use((err,req,res,next)=>{console.error(err);if(err.code==='ER_NO_SUCH_TABLE'||err.code==='ECONNREFUSED')return res.status(503).json({error:'Database is not ready. Check DB settings and import sql/schema.sql.'});res.status(500).json({error:process.env.NODE_ENV==='production'?'Internal server error.':err.message});});
const port=Number(process.env.PORT||5000);
app.listen(port,'0.0.0.0',()=>console.log(`Labour Bridge API listening on port ${port}`));
