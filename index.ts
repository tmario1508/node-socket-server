import http from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import { Socket } from 'socket.io'
import ENV from './enviroments/env';
import MongoHelper from './helpers/mongo.helpers';
import SocketLogic from './sockets/socket.logic';

const mongo = MongoHelper.getInstance(ENV.MONGODB);

(async() => {

    await mongo.connect(ENV.MONGODB.DATABASE);

    if (mongo.statusConnection.status == 'success'){

        console.log(`Conexion exitosa a MongoDB en el puerto ${ENV.MONGODB.PORT}`)

        //Correr express
        const app = express();
        app.use(express.json());
        app.use(compression());


        let whitelist = [
            'http://localhost:4200',
            'http://localhost:5200',
            'http://www.midominio.com'
        ];

        app.use(cors({
            origin: (origin, callback) => {
            // allow requests with no origin
            if(!origin) return callback(null, true);
            if(whitelist.indexOf(origin) === -1) {
            var message = `The CORS policy for this origin doesn't allow access from the particular origin.`;
            return callback(new Error(message), false);
            }
            return callback(null, true);
            }
        }));

        //app.use(cors({origin: true, credentials: true}));

        app.get('/', (req: Request, res: Response) => {
            res.status(200).json({
                ok: true,
                msg: 'API Real-Time funcionando correctamente'
            });
        });

        const htttpServer = http.createServer(app);

        const socketIO = require('socket.io')(htttpServer, {
            cors: {
                origin: whitelist,
                credentials: true,
            },
            allowEIO3: true
        });

        const socketLogic = SocketLogic(mongo);

        // Funcionalidad Real-Time
        socketIO.on('connection', (socket: Socket) => {
            //To do: Logica Real-Time
            console.log(`Nuevo cliente conectado con ID: ${socket.id}`);

            //Logic SignUp
            socketLogic.signUp(socketIO, socket);

            //Logic disconnect
            socketLogic.disconnect(socket);

            socket.on('signUp', (payload: any) => {
                //TO DO: save to DataBase

            })

            

        });

        htttpServer.listen(ENV.API.PORT, () =>{
            console.log(`Servidor Express funcionando correctamente en puerto ${ENV.API.PORT}`);
        });

    }else{
        console.log('No se pudo establecer conexion con la base de datos')
    }

})();

// Handle error
process.on('unhandleRejection', (error: any, promise) => {
    console.log('Ocurrio un error no controlado de tipo promise rejection: ', promise);
    console.log('La descripción de error es la siguiente: ', promise);
    //Close Mongo
    mongo.close();
    process.exit();

});