import { pool } from "../data/database.js";
export const createRooms=  async(req,res,next)=>{
    const sql =`INSERT INTO rooms(
        id_num, ward, floor, wing, availability_status)
        VALUES (?,?,?,?,?);`;
    const [rooms] = await pool.query(sql,
        [req.body.serial_num, req.body.wrd, req.body.flr, 
            req.body.wng, req.body.status]);
    if(rooms.insertId){
        res.status(201).json({
            status:'success',
            message:'room created',
            id:rooms.insertId
        });
    }else{
        res.status(400).json({
            status:'error',
            message:'check for errors'
        });
    };
};

export const getAllRooms = async(req,res,next)=>{
    let { page, limit} =req.query
    let limitStr =''
    const _page =+page || 1;
    const _limit = +limit ||2;
    const _offset = (_page - 1)* _limit;
    let _maxRecords =0;
    limitStr =`LIMIT ${_limit} OFFSET ${_offset};`
    const sql = `SELECT * FROM rooms`
    const [numRecords] = await pool.query(`SELECT COUNT (*) AS count FROM (${sql})T `);
    const [rooms] = await pool.query(`SELECT * FROM (${sql})T ${limitStr}`);
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
            data:{rooms}
        });
    }else{
        _page = 1
    }
};

export const getSingleRooms = async(req,res,next)=>{
    const id = req.params.id
    const sql = `SELECT * FROM rooms WHERE id = ?;`;

    const [room] = await pool.query(sql,[id]);
    if (room.length > 0){
        res.status(200).json({
            status:'success',
            result:room.length,
            data:{room:room[0]}
        });
    }else{
        res.status(404).json({
            status:'error',
            message:'no data to retrieve'
        });
    };
};

export const updateRoom = async(req,res,next)=>{
    const id = req.params.id;
    const sql = `UPDATE rooms
    SET id_num=?, ward=?, floor=?, wing=?, availability_status=?
    WHERE id = ?;`;
    const eRoom = await pool.query(sql,
        [req.body.id_num, req.body.ward, req.body.floor, req.body.wing,
            req.body.availability_status, id])
    if (eRoom.affectedRows <= 0){
        
        res.status(400).json({
            status:'error',
            message:'no data to update'
        });
    }else{
        res.status(200).json({
            status:'success',
            message:'room info updated',            
        });
    };
};

export const deleteRoom = async(req,res,next)=>{
    const  id = req.params.id;
    const sql = `DELETE FROM rooms WHERE id = ?`

    const [noRoom] = await pool.query(sql,[id])
    if(noRoom.affectedRows){
        res.status(200).json({
            status:'success',
            affectedRows:noRoom.affectedRows,
            message:'no more records. delete successful'
        });
    }else{
        res.status(400).json({
            status:'error',
            message:'not able to complete task'
        });
    };
};