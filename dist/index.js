"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const env_1 = __importDefault(require("./enviroments/env"));
const mongo_helpers_1 = __importDefault(require("./helpers/mongo.helpers"));
const socket_logic_1 = __importDefault(require("./sockets/socket.logic"));
const mongo = mongo_helpers_1.default.getInstance(env_1.default.MONGODB);
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield mongo.connect(env_1.default.MONGODB.DATABASE);
    if (mongo.statusConnection.status == 'success') {
        console.log(`Conexion exitosa a MongoDB en el puerto ${env_1.default.MONGODB.PORT}`);
        //Correr express
        const app = express_1.default();
        app.use(express_1.default.json());
        app.use(compression_1.default());
        let whitelist = [
            'http://localhost:4200',
            'http://localhost:5200',
            'http://www.midominio.com'
        ];
        app.use(cors_1.default({
            origin: (origin, callback) => {
                // allow requests with no origin
                if (!origin)
                    return callback(null, true);
                if (whitelist.indexOf(origin) === -1) {
                    var message = `The CORS policy for this origin doesn't allow access from the particular origin.`;
                    return callback(new Error(message), false);
                }
                return callback(null, true);
            }
        }));
        //app.use(cors({origin: true, credentials: true}));
        app.get('/', (req, res) => {
            res.status(200).json({
                ok: true,
                msg: 'API Real-Time funcionando correctamente'
            });
        });
        const htttpServer = http_1.default.createServer(app);
        const socketIO = require('socket.io')(htttpServer, {
            cors: {
                origin: whitelist,
                credentials: true,
            },
            allowEIO3: true
        });
        const socketLogic = socket_logic_1.default(mongo);
        // Funcionalidad Real-Time
        socketIO.on('connection', (socket) => {
            //To do: Logica Real-Time
            console.log(`Nuevo cliente conectado con ID: ${socket.id}`);
            //Logic SignUp
            socketLogic.signUp(socketIO, socket);
            //Logic disconnect
            socketLogic.disconnect(socket);
            socket.on('signUp', (payload) => {
                //TO DO: save to DataBase
            });
        });
        htttpServer.listen(env_1.default.API.PORT, () => {
            console.log(`Servidor Express funcionando correctamente en puerto ${env_1.default.API.PORT}`);
        });
    }
    else {
        console.log('No se pudo establecer conexion con la base de datos');
    }
}))();
// Handle error
process.on('unhandleRejection', (error, promise) => {
    console.log('Ocurrio un error no controlado de tipo promise rejection: ', promise);
    console.log('La descripción de error es la siguiente: ', promise);
    //Close Mongo
    mongo.close();
    process.exit();
});