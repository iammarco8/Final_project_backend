import { pool } from '../data/database.js';
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

export const createAppointment = async(req,res,next)=>{
    const sql = `INSERT INTO appointments( payment_status, confirmation_status, patient_id, doctor_id, room_id, admin_id)
                VALUES(?,?,?,?,?,?);`;
    const [appointment] = await pool.query(sql, 
        [req.body.pay_stat, req.body.confirmed, 
            req.body.patient, req.body.doctor, req.body.room, req.body.admn]);
        if(appointment.insertId <=0){
            res.status(201).json({
                status:'success',
                message:'appointment made, <br> look for appointment number:',
                id:appointment.insertId
            })
        }else{
            res.status(404).json({
                status:'error',
                message:'could not add appointment. <br> Check field entry or body request name. Reffer to manual'
            });
        }
}

export const getAllAppointments = async(req, res, next)=>{
    let { page, limit} =req.query
    // let { page, limit} =req.query
    let limitStr =''
    const _page =+page || 1;
    const _limit = +limit ||2;
    const _offset = (_page - 1)* _limit;
    let _maxRecords =0;
    limitStr =`LIMIT ${_limit} OFFSET ${_offset};`
    const sqlQuery = `SELECT ap.id, ap.time, ap.payment_status, ap.confirmation_status, 
    p.first_name, p.last_name, p.sex, p.email, 
    p.payments_or_insurance, p.allergies_or_chronic_issues, p.current_treatments,
    a.first_name as adminfirst, a.last_name as adminlast, a.position as adminPosition, a.department as adminDepartment,
    d.id as doc_id, d.first_name as doctorfirst, d.last_name as doctorlast, d.position, d.department,
    d.specialty, r.id_num as roomnum, r.ward, r.floor, r.wing, r.availability_status
    FROM appointments ap, patients p, admin a, doctors d, rooms r
    WHERE ap.patient_id = p.id AND
    ap.doctor_id = d.id AND
    ap.room_id = r.id AND
    ap.admin_id = a.id`;
    const [numRecords] = await pool.query(`SELECT COUNT (*) AS count FROM (${sqlQuery})T `) || 1;
    const [appointments2] =  await pool.query(`SELECT * FROM (${sqlQuery})T ${limitStr}`);
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
            data:{appointments2 }
        });
    }else{
        _page = 1
    }
};
export const getSingleAppointments = async(req, res, next)=>{
    const id = req.params.id;
    const sqlQuery = `SELECT ap.id as appointment_number, ap.time, ap.payment_status, ap.confirmation_status, 
    p.id as patient_num, p.first_name, p.last_name, p.sex, p.email, 
    p.payments_or_insurance, p.allergies_or_chronic_issues, p.current_treatments,
    a.first_name as adminfirst, a.last_name as adminlast, a.position as adminpos, a.department as adminDepartment,
    d.first_name as doctorfirst, d.last_name as doctorlast, d.position, d.department, 
    d.specialty, r.id_num as roomnum, r.ward, r.floor, r.wing, r.availability_status
    FROM appointments ap, patients p, admin a, doctors d, rooms r
    WHERE ap.patient_id = p.id AND
    ap.doctor_id = d.id AND
    ap.room_id = r.id AND
    ap.admin_id = a.id AND
    ap.id= ?;`;
    const [appointment] = await pool.query(sqlQuery, [id]);
    if(appointment.length > 0){
        res.status(200).json({
            status:'success',
            result:appointment.length,
            data: { appointment:appointment[0] }
        });
    }else{
        res.status(404).json({
            status:'no data found',
            message:'nothing to return'
        });
    };
};
export const updateAppointment = async(req,res,next)=>{
    const id = req.params.id;
    const sql = `UPDATE appointments
                    SET time=?, payment_status=?, patient_id = ?, 
                    confirmation_status=?, doctor_id=?, room_id=?, admin_id =?
                    WHERE id= ?;`;

    // this function should be called after the submit to display the edited data set
    // const [edited] = await getAllAppointments()
    
    const appointment = await pool.query(sql, 
        [req.body.tme, req.body.pay_stat, req.body.patient, req.body.confirmed, 
        req.body.doctor, req.body.room, req.body.admn, id])
    if(appointment.affectedRows<=0){
         res.status(400).json({
            status:'error',
            message:'unable to update'
        });
    }else{
       res.status(202).json({
            status:'success',
            affectedRows: appointment.affectedRows
            // ,data: { data:edited[0] }
        });
    };
};
export const deleteAppointment = async(req,res,next)=>{
    const id = req.params.id;
    const sql = `DELETE FROM appointments WHERE id = ?`

    const [noAppointment] = await pool.query(sql, [id])
    if(noAppointment.affectedRows){
        res.status(200).json({
            status:'success',
            affectedRows:noAppointment.affectedRows,
            message:'data no longer exsists'
        });
    }else{
        res.status(400).json({
            status:'error',
            message:'cannot delete. Check parameters.'
        });
    };
};