const router = require('express').Router();
const pool = require('../db');
const { requireAuth, allowRoles } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const { keyword = '', location = '', category = '', jobType = '', limit = 100, offset = 0 } = req.query;
    const n = Math.min(Math.max(Number(limit) || 100, 1), 100);
    const o = Math.max(Number(offset) || 0, 0);
    const [rows] = await pool.execute(
      `SELECT j.id,j.employer_id,j.title,j.company,j.description,j.category,j.location,j.job_type,j.wage_min,j.wage_max,j.wage_period,j.required_skills,j.vacancies,j.status,j.created_at,u.name AS employer_name
       FROM jobs j JOIN users u ON u.id=j.employer_id
       WHERE j.status='open' AND (?='' OR j.title LIKE CONCAT('%',?,'%') OR j.description LIKE CONCAT('%',?,'%') OR j.required_skills LIKE CONCAT('%',?,'%'))
       AND (?='' OR j.location LIKE CONCAT('%',?,'%')) AND (?='' OR j.category=?) AND (?='' OR j.job_type=?)
       ORDER BY j.created_at DESC LIMIT ${n} OFFSET ${o}`,
      [keyword,keyword,keyword,keyword,location,location,category,category,jobType,jobType]);
    res.json({ jobs: rows });
  } catch (e) { next(e); }
});
router.get('/:id', async (req, res, next) => {
  try { const [rows] = await pool.execute('SELECT j.*,u.name AS employer_name FROM jobs j JOIN users u ON u.id=j.employer_id WHERE j.id=?', [req.params.id]); if (!rows.length) return res.status(404).json({error:'Job not found.'}); res.json({job:rows[0]}); } catch(e){next(e);}
});
router.post('/', requireAuth, allowRoles('employer','admin'), async (req,res,next)=>{
  try {
    const {title,company,description,category,location,job_type='Full-time',wage_min=0,wage_max=null,wage_period='day',required_skills='',vacancies=1}=req.body;
    if(!title||!description||!location) return res.status(400).json({error:'title, description and location are required.'});
    const [r]=await pool.execute('INSERT INTO jobs (employer_id,title,company,description,category,location,job_type,wage_min,wage_max,wage_period,required_skills,vacancies) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',[req.user.id,title,company||null,description,category||'General',location,job_type,Number(wage_min)||0,wage_max===null||wage_max===''?null:Number(wage_max),wage_period,required_skills,vacancies]);
    const [rows]=await pool.execute('SELECT * FROM jobs WHERE id=?',[r.insertId]); res.status(201).json({job:rows[0]});
  } catch(e){next(e);}
});
router.patch('/:id',requireAuth,allowRoles('employer','admin'),async(req,res,next)=>{
  try { const [rows]=await pool.execute('SELECT employer_id FROM jobs WHERE id=?',[req.params.id]); if(!rows.length)return res.status(404).json({error:'Job not found.'}); if(req.user.role!=='admin'&&rows[0].employer_id!==req.user.id)return res.status(403).json({error:'You can edit only your own job posts.'});
    const allowed=['title','company','description','category','location','job_type','wage_min','wage_max','wage_period','required_skills','vacancies','status']; const sets=[];const vals=[];for(const k of allowed)if(req.body[k]!==undefined){sets.push(`${k}=?`);vals.push(req.body[k]);}if(!sets.length)return res.status(400).json({error:'No editable fields supplied.'});vals.push(req.params.id);await pool.execute(`UPDATE jobs SET ${sets.join(',')} WHERE id=?`,vals);const [updated]=await pool.execute('SELECT * FROM jobs WHERE id=?',[req.params.id]);res.json({job:updated[0]});
  }catch(e){next(e);}
});
router.delete('/:id',requireAuth,allowRoles('employer','admin'),async(req,res,next)=>{try{const [rows]=await pool.execute('SELECT employer_id FROM jobs WHERE id=?',[req.params.id]);if(!rows.length)return res.status(404).json({error:'Job not found.'});if(req.user.role!=='admin'&&rows[0].employer_id!==req.user.id)return res.status(403).json({error:'You can close only your own job posts.'});await pool.execute("UPDATE jobs SET status='closed' WHERE id=?",[req.params.id]);res.json({success:true,message:'Job closed.'});}catch(e){next(e);}});
module.exports=router;
