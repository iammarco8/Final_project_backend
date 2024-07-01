import { pool } from "../data/database.js";
import bcrypt from 'bcryptjs';
import { json } from "express";
import JWT from 'jsonwebtoken';
import { token } from "morgan";

// PAYLOAD
function signJWTToken(user){
    return JWT.sign({
        id: user.id,
        role: user.position},
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    )
};

 async function docExsist(email){
    let sql = `SELECT * FROM doctors WHERE email =?`;
    const [doc]= await  pool.query(sql, [email]);
    if (doc.length > 0){
        return true;
    }else{
        return false;
    }
}

// this will act as a doctor user signup all in one
export const createDoctor = async(req, res, next )=>{
    const vDate = new Date();
    const sql = `INSERT INTO doctors(
        first_name, last_name, phone_num, email, position,
        department, specialty, password, last_login)
    VALUES
        (?,?,?,?,?,?,?,?,?);`;
    if (await docExsist(req.body.eml)){
        res.status(400).json({
            status:'error',
            message:'User already exsist'
        })
        return;
    }
    req.body.pass = await bcrypt.hashSync(req.body.pass)
    const [doctor] = await pool.query(sql,
        [req.body.f_nm, req.body.l_nm, req.body.p_nbr, req.body.eml,
            req.body.pos, req.body.dep, req.body.forte, req.body.pass, vDate]);
    if(doctor.insertId<=0){
        res.status(400).json({
            status:'error',
            message:'check for errors'
        });
    }else{
        const token = signJWTToken({id: doctor.insertId, roles: 'Doctor'})
        res.status(201).json({
            status:'success',
            message:'create success',
            id:doctor.insertId,
            data:{
                token,
                user: req.body
            }
        });
        
    }
};

// doctor login
export const loginDoc = async(req,res,_next)=>{
    const [doc] = await pool.query(`
    SELECT * FROM doctors WHERE email = ? AND first_name = ? AND last_name= ?`,
    [req.body.email, req.body.f_nm, req.body.l_nm ]);
    if(!doc.length){
        return res.status(404).json({
            status:'error',
            message:'None found. Check feilds'
        })
    }else if(!(await bcrypt.compare(req.body.pass, doc[0].password))){
        return res.status(404).json({
            status:'error',
            message:'Invalid credentials'
        });
    }else{
        await pool.query(`UPDATE doctors SET last_login = CURRENT_TIMESTAMP() WHERE id =?`, [doc[0].id])
        const token = signJWTToken(doc[0]);
        doc[0].password = undefined;
        
        res.status(200).json({
            status:'success',
            data:{
                token,
                user: doc[0]
            }
        })
    }
}

// function for the self reffereal of user. the protect function is required
export const docUser = async (req, res, next)=>{
    const doc = req.user;
    console.log(`doctor is:${JSON.stringify(doc)}`)
    if (!doc)
        return next();
    doc.password = undefined;
    let strQuery = `SELECT * FROM doctors WHERE id =?`
    const [user]= await pool.query(strQuery,[doc.id]);
    if(!user.length){
        return res.status(401).json({
            status:'error',
            massage:'Invalid request'
        });
    }
    next();
    user[0].password=undefined;
    return res.status(200).json({
        status:'success',
        data:{
            user: user[0]
        }
    });
}


export const protectDoc = async(req,res, next)=>{
    const authorization = req.get('Authorization');
    console.log(`REQUEST PROTECT FUNCTION OBJECT ${JSON.stringify(req.headers)}`);
    console.log(`REQUEST AUTHORIZATION >> ${authorization}`);
    if(!authorization?.startsWith('Bearer')){
        return next(
            res.status(400).json({
                status:'error',
                message:'Cannot accsess without logging in'
            })
        )
    }
    const token = authorization.split(' ')[1];
    console.log(`TOKEN IS: ${token}`)
    try{
        const decoded = JWT.verify(token, process.env.JWT_SECRET);
        console.log(`DECODED TOKEN: ${JSON.stringify(decoded)}`);
        const [doc] = await pool.query(`SELECT * FROM doctors WHERE id = ?`,[decoded.id])
        if(!doc.length){
            return next(
                res.status(401).json({
                    status:'error' ,
                    message:'Doctor no longer valid'
                }) 
            );
        }
        console.log(`doc[0]${JSON.stringify(doc[0])}`);
        const data = doc[0];
        data.password = undefined;
        req.user = data;
        // console.log(`req.user: ${json.stringify}`);
        next();
    }catch(error){
        console.log(error.message)
        if(error.message){
            return next(
                res.status(400).json({
                    status:'error',
                    message:'token expired'
                })
            );
        }else if(error.message == 'jwt malformed'){
            return next(
                res.status(400).json({
                    status:'error',
                    message:'token malformed'
                })
            );
        }else if(error.message == 'invalid token'){
            return next(
                res.status(400).json({
                    status:'error',
                    message: 'token is invalid'
                })
            );
        }else{
            return next(
                res.status(400).json({
                    status:'error',
                    message:'Unknown Error...'
                })
            );
        }
    }
}

// show only appointments meant for the doc user
export const docAppointments = async (req, res, next)=>{
    let {page, limit} = req.query;
    let limitStr =''; 
    const _page = +page  || 1;
    const _limit = +limit || 2;
    const _offset = (_page - 1)* _limit;
    let _maxRecords = 0;
    const doc = req.user;
    // const appointmentTime = Date.now();
    // const sql = `SELECT * FROM appointments WHERE time >= NOW() AND doctor_id=?`
    // const sql = `SELECT * FROM appointments WHERE time >= NOW() AND doctor_id= ${doc.id}`
    const sql = `
        SELECT ap.id, ap.time, 
        p.first_name, p.last_name, p.sex, p.email, p.allergies_or_chronic_issues, p.current_treatments,
        a.first_name as adminfirst, a.last_name as adminlast, a.position as adminPosition, a.department as adminDepartment,
        d.id as doc_id, d.first_name as doctorfirst, d.last_name as doctorlast, d.position, d.department,
        d.specialty, r.id_num as roomnum, r.ward, r.floor, r.wing, r.availability_status
        FROM appointments ap, patients p, admin a, doctors d, rooms r 
        WHERE 
        ap.patient_id = p.id AND
        ap.room_id = r.id AND
        ap.admin_id = a.id AND
        time >= NOW() AND 
        d.id= ${doc.id}`
    // const currentAppointment = await pool.query(sql,[doc.id]);
    const [numRecords] = await pool.query(`SELECT COUNT (*) AS count FROM (${sql}) as T `);
    const [appointments] = await pool.query(`SELECT * FROM (${sql})T ${limitStr}`);
    // const [numRecords] = await pool.query(`SELECT COUNT (*) AS count FROM (${currentAppointment})T `);
    // const [doctor] = await pool.query(`SELECT * FROM (${currentAppointment})T ${limitStr}`);
    
    _maxRecords = numRecords[0]['count'];
    let numPages = +page                    
                    ? Math.ceil( (_maxRecords || 0)/ limit || 10)
                    : undefined; 
    console.log(`numPages: ${numPages}`);

    if(_page>=1){
        res.status(200).json({
            status:'success',
            page,
            limit,
            numPages, 
            maxRecords: _maxRecords,
            data:{
               appointments
            }
        })
    }else{
        _page = 1
    }
}

// returns a full list of doctors in a paginated form
export const getAllDoctorsPag = async(req,res,next)=>{
    console.log(`REQUEST Query:${JSON.stringify(req.query)}`);
    let {page, limit} = req.query;
    let limitStr =''; 
    const _page = +page  || 1;
    const _limit = +limit || 2;
    const _offset = (_page - 1)* _limit;
    let _maxRecords = 0;


    limitStr=`LIMIT ${_limit} OFFSET ${_offset}`;
    const sql = `SELECT * FROM doctors`;
    // const [numRecords] = await pool.query(`SELECT COUNT (*) AS count FROM (${sql})T ${limitStr}`);
    const [numRecords] = await pool.query(`SELECT COUNT (*) AS count FROM (${sql})T `);
    const [doctor] = await pool.query(`SELECT * FROM (${sql})T ${limitStr}`);

    _maxRecords = numRecords[0]['count'];
    let numPages = +page                    
                    ? Math.ceil( (_maxRecords || 0)/ limit || 10)
                    : undefined; 
    console.log(`numPages: ${numPages}`);
    // const [doctor]= await pool.query(sql);
    if(_page>=1){
        res.status(200).json({
            status:'success',
            page,
            limit,
            numPages, 
            maxRecords: _maxRecords,
            data:{
                doctor
            }
        })
        // console.log(`page is:${_page}` )
    }else{
        _page = 1
    }
    // _next();
}

export const getAllDoctors = async(req,res,next)=>{
    const sql = `SELECT * FROM doctors;`;

    const[doctor]=await pool.query(sql);

    if(doctor.length > 0){
        res.status(200).json({
            status:'success',
            results:doctor.length,
            data:{doctor}
        });
    }else{
        res.status(404).json({
            status:'error',
            message:'none to display'
        });
    };
};

export const getSingleDoctor = async(req,res,next)=>{
    const id = req.params.id;
    const sql = `SELECT * FROM doctors WHERE id = ?;`;

    const [doctor] = await pool.query(sql,[id]);
    if (doctor.length>0){
        res.status(200).json({
            status:'success',
            results:doctor.length,
            data:{doctor:doctor[0]}
        });
    }else{
        res.status(404).json({
            status:'error',
            message:'nothing to return'
        });
    };
};

export const updateDoctor = async (req,res,next)=>{
    const id = req.params.id;
    const sql = `UPDATE doctors
    SET first_name=?, last_name=?, phone_num=?, email=?, position=?,
    department=?, specialty=?, password=?
    WHERE id =?`;
    const eDoctor= await pool.query(sql,[req.body.f_nm, req.body.l_nm, req.body.p_nbr, 
        req.body.eml, req.body.pos, req.body.dep, req.body.forte, req.body.pass, id]);
    if(eDoctor.affectedRows <= 0){
       
        res.status(400).json({
            status:'error',
            message:'no rows affected'
        });
    }else{
         res.status(202).json({
            status:'success',
            affectedRows: eDoctor.affectedRows
        });
    };
};

export const deleteDoctor = async(req,res,next)=>{
    const id = req.params.id;
    const sql = `DELETE  FROM doctors WHERE id = ?`;

    const [noDoctor]= await pool.query(sql,[id])
    if(noDoctor.affectedRows){
        res.status(200).json({
            status:'success',
            affectedRows:noDoctor.affectedRows,
            message:'data deleted'
        });
    }else{
        res.status(400).json({
            status:'error',
            message:'no data to delete'
        });
    };
};