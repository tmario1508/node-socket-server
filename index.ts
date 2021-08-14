import http from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import { Socket } from 'socket.io'
import ENV from './enviroments/env';
import MongoHelper from './helpers/mongo.helpers';
import SocketLogic from './sockets/socket.logic';
import TokenHelper from './helpers/token.helper';

const mongo = MongoHelper.getInstance(ENV.MONGODB);
const tokenHelper = TokenHelper(ENV, mongo);

(async () => {

    await mongo.connect(ENV.MONGODB.DATABASE);

    if (mongo.statusConnection.status == 'success') {

        console.log(`Conexion exitosa a MongoDB en el puerto ${ENV.MONGODB.PORT}`)

        //Correr express
        const app = express();
        app.use(express.json());
        app.use(compression());


        let whitelist = [
            'http://10.2.76.2:4200',
            'http://200.79.82.178:8090'
        ];

        app.use(cors({
            origin: (origin, callback) => {
                // allow requests with no origin
                if (!origin) return callback(null, true);
                if (whitelist.indexOf(origin) === -1) {
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

        app.post('/loginOAuth2', async (req: Request, res: Response) => {

            const { correo, apiKey } = req.body;

            
            const response: any = await mongo.db.collection('usuarios')
                .findOne(
                    { correo, isVerify: true },
                    { projection: {_id: 0, correo: 1, fotoURL: 1, nombreCompleto: 1}}
                )
                .then((result: any) => {
                    if (!result) {
                        return {
                            ok: false,
                            code: 404,
                            msg: `Lo sentimos, el usuario ${correo} no se ha registrado`
                        }
                    }
                    return {
                        ok: true,
                        code: 200,
                        msg: `Inicio de sesion realizado de manera exitosa para ${correo}`,
                        result
                    }
                })
                .catch((error: any) => {
                    return {
                        ok: false,
                        code: 500,
                        msg: `Ocurrio un error no contemplado al iniciar sesion con ${correo}`
                    }
                })

            if (response.ok == false) {
                res.status(response.code).json(response);
            } else {
                //Solicitar token para usuario
                const token: any = await tokenHelper.create(response.result, apiKey);
                res.status(response.code).json({token});
            }

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
            //console.log(`Nuevo cliente conectado con ID: ${socket.id}`);

            //Socket connect
            socketLogic.listenSocketConnect(socket);

            //Logic SignUp
            socketLogic.signUp(socketIO, socket);

            //Logic disconnect
            socketLogic.disconnect(socket);

            socket.on('signUp', (payload: any) => {
                //TO DO: save to DataBase

            })



        });

        htttpServer.listen(ENV.API.PORT, () => {
            console.log(`Servidor Express funcionando correctamente en puerto ${ENV.API.PORT}`);
        });

    } else {
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