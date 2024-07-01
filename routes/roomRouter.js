import express from 'express';
import { getAllRooms,getSingleRooms,createRooms,updateRoom,deleteRoom } from '../controllers/roomsController.js';
export const roomRouter = express.Router();

roomRouter
        .route('/')
        .get(getAllRooms)
        .post(createRooms)
roomRouter
        .route('/:id')
        .get(getSingleRooms)
        .patch(updateRoom)
        .delete(deleteRoom)