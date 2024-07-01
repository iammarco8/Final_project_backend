import { pool } from "../data/database.js";
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

export const createPatient = async(req, res,next)=>{
    const sql= `INSERT INTO patients(
        first_name, last_name, sex, phone_num, email, payments_or_insurance, 
        allergies_or_chronic_issues, current_treatments, med_history, doctors_comments)
        VALUES(?,?,?,?,?,?,?,?,?,?);`;

    const [patients] = await pool.query(sql,
        [req.body.f_nm, req.body.l_nm, req.body.sx, req.body.phn,
        req.body.eml, req.body.pay, req.body.allergy, req.body.treatment,
        req.body.history, req.body.comment]);
    if(patients.insertId){

        res.status(201).json({
            status:'success',
            results:patients.insertId
        });
    }else{
        res.status(400).json({
            status:'error',
            message:'could not add patient'
        });
    };
};

export const getAllPatients = async(req,res,next)=>{
    let { page, limit} =req.query
    // let { page, limit} =req.body 
    let limitStr =''
    const _page = +page || 1;
    const _limit = +limit ||2;
    const _offset = (_page - 1)* _limit;
    let _maxRecords =0;
    limitStr =`LIMIT ${ _limit} OFFSET ${_offset};`
    const sql = `SELECT * FROM patients`
    const [numRecords] = await pool.query(`SELECT COUNT (*) AS count FROM (${sql})T `);
    const [patients] = await pool.query(`SELECT * FROM (${sql})T ${limitStr}`);
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
            data:{patients}
        });
    }else{
        _page = 1
    }
};

export const getSinglePatient = async(req,res,next)=>{
    const id = req.params.id;
    const sql = `SELECT * FROM patients WHERE id= ?`

    const [patients]= await pool.query(sql,[id])

    if(patients.length){
        res.status(200).json({
            status:'success',
            result:patients.length,
            data:{patients:patients[0]}
        });
    }else{
        res.status(404).json({
            status:'error',
            message:'nothing to show'
        });
    };
};

export const updatePatient = async(req,res,next)=>{
    const id = req.params.id;
    const sql = `UPDATE patients
    SET first_name = ?, last_name = ?, sex = ?, phone_num = ?, email = ?, 
    payments_or_insurance = ?, allergies_or_chronic_issues = ?, 
    current_treatments = ?, med_history = ?, doctors_comments = ?
    WHERE id = ?`
    const ePatient = await pool.query(sql,
        [req.body.f_nm, req.body.l_nm, req.body.sx, req.body.phn,
        req.body.eml, req.body.pay, req.body.allergy, req.body.treatment,
        req.body.history, req.body.comment, id]);
    if(ePatient.affectedRows <= 0){
        res.status(400).json({
            status:'error',
            message:'nothing to update'
        });
    }else{
        res.status(201).json({
            status:'success',
            affectedRows:ePatient,
            message: 'Update succesful'
        });
        
    };
};

export const deletePatient = async(req,res,next)=>{
    const id = req.params.id;
    const sql = `DELETE FROM patients WHERE id= ?`
    const [noPatient] = await pool.query(sql,[id]);
    if(noPatient.affectedRows){
        res.status(201).json({
            status:'success',
            affectedRows: noPatient.affectedRows,
            message:'deleted'
        });
    }else{
        res.status(400).json({
            status:'error',
            message:'nothing to delete'
        });
    };
};