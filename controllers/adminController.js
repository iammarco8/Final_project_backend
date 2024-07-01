import { pool }from '../data/database.js';
import { json }from "express";
import{token} from 'morgan';
import JWT from'jsonwebtoken';
import bcrypt from 'bcryptjs'


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

// function for checking if the admin exsist. relys on the email alone. more thaan one people may have the same name
async function adminExist(email){
    let sql = `SELECT * FROM admin WHERE email= ?`;
    const [admin] = await pool.query(sql, [email]);
    if (admin.length > 0){
        return true;
    }else{
        return false;
    }
}

export const createAdmin = async(req,res,next)=>{
    const vDate = new Date();
    const sqlQuery = `INSERT INTO admin (
        first_name, last_name, phone_num, email, position, 
        department, password
        )
        VALUES
        (?,?,?,?,?,?,?);`;
    if (await adminExist(req.body.eml)){
        res.status(400).json({
            status:'error',
            message:'Admin already exsist'
        })
        return;
    }
    req.body.pass = await bcrypt.hashSync(req.body.pass)
    const [admin] = await pool.query(sqlQuery,
        [req.body.f_nm, req.body.l_nm, req.body.p_nbr, req.body.eml, 
        req.body.pos, req.body.dep, req.body.pass]);
        if(admin.insertId > 0 ){
            const token = signJWTToken({id: admin.insertId, roles: 'Admin   '})
            res.status(201).json({
                status:'success',
                messsage:'insert successful',
                id:admin.insertId,
                data:{
                    token, 
                    user:req.body
                }
            })
        }else{
            res.status(404).json({
                status: "error",
                message: 'no data input'
            });
        }
};
// admin login
export const loginAdmin = async(req,res,_next)=>{
    const [admin]= await pool.query(`
        SELECT * FROM admin WHERE email = ? AND first_name = ? AND last_name = ?`,
    [req.body.email, req.body.f_nm, req.body.l_nm]);
    if(!admin.length){
        return res.status(404).json({
            status:'error',
            message:'None found. check feilds'
        })
    }else if(!(await bcrypt.compare(req.body.pass, admin[0].password))){
        return res.status(404).json({
            status:'error',
            message:'Invalid credentials'
        });
    }else{
        await pool.query(`UPDATE admin SET last_login = CURRENT_TIMESTAMP() WHERE id =?`, [admin[0].id])
        const token = signJWTToken(admin[0]);
        admin[0].password = undefined;
        // console.log()
        res.status(200).json({
            status:'success',
            data:{
                token,
                user: admin[0]
            }
        })
    }
}

// this is for returning the self refence of the admin user. protect admin is needed to generate the user
export const adminUser = async (req, res, next)=>{
    const admin = req.user;
    console.log(`admin is: ${JSON.stringify(admin)}`)
    if (!admin)
        return next();
    admin.password = undefined;
    let strQuery = `SELECT * FROM admin WHERE id =?`
    const [user]= await pool.query(strQuery,[admin.id]);
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


export const protectAdmin = async(req,res, next)=>{
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
        const [admin] = await pool.query(`SELECT * FROM admin WHERE id = ?`,[decoded.id])
        if(!admin.length){
            return next(
                res.status(404).json({
                    status:'error' ,
                    message:'Admin no longer valid'
                }) 
            );
        }
        console.log(`admin[0]${JSON.stringify(admin[0])}`);
        const data = admin[0];
        data.password = undefined;
        req.user = data;
        // console.log(`req.user${json.stringify}`);
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

// return admin data. uses pagination from sql side.
export const getAllAdmins = async(req,res,next)=>{
    let { page, limit} =req.query
    let limitStr =''
    const _page =+page || 1;
    const _limit = +limit ||2;
    const _offset = (_page - 1)* _limit;
    let _maxRecords =0;
    limitStr =`LIMIT ${_limit} OFFSET ${_offset};`
    const sql = `SELECT * FROM admin`
    const [numRecords] = await pool.query(`SELECT COUNT (*) AS count FROM (${sql})T `);
    const [admin] = await pool.query(`SELECT * FROM (${sql})T ${limitStr}`);
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
            data:{admin}
        });
    }else{
        _page = 1
    }
};

export const getSingleAdmin = async(req,res,next)=>{
    const id = req.params.id;
    const sqlQuery = `SELECT * FROM admin WHERE id = ?`

    const[admin] = await pool.query(sqlQuery,[id])

    if(admin.length){
        res.status(200).json({
            status:' success',
            result:admin.length,
            data: { admin: admin[0] }
        });
    }else{
        res.status(404).json({
            status:'error',
            messsage:'no data to retreive'
        });
    };
};

export const updateAdmin = async(req,res,next)=>{
    const id = req.params.id;
    const sql = `UPDATE admin
                    SET first_name = ?, last_name = ?, phone_num = ?,
                    email = ?, position = ?, department = ?, password =?
                    WHERE id = ?`;
    const admin = await pool.query(sql,
        [req.body.f_nm, req.body.l_nm, req.body.p_nbr, req.body.eml, 
            req.body.pos, req.body.dep, req.body.pass, id]);
    if(admin.affectedRows<=0)
        {res.status(400).json({
            status:'error',
            message:'unable to update'
        });
        // console.log(`${req.body.f_nm}`)
        }else{
        res.status(202).json({
            status:'success',
            affectedRows: admin.affectedRows
        });
        
    };
};

export const deleteAdmin = async(req,res,next)=>{
    const id = req.params.id;
    const sql = `DELETE FROM admin WHERE id = ?`
    const [noAdmin] = await pool.query(sql, [id])
    if(noAdmin.affectedRows){
        res.status(201).json({
            status:'success',
            affectedRows: noAdmin.affectedRows,
            message:'data no longer exsists'
        });
    }else{
        res.status(400).json({
            status:'error',
            message:'no affected rows'
        });
    };
};