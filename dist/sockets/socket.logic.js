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
Object.defineProperty(exports, "__esModule", { value: true });
//const mongo = MongoHelper.getInstance(ENV.MONGODB);
let userList = [];
exports.default = (mongo) => {
    return {
        listenSocketConnect: (socket) => __awaiter(void 0, void 0, void 0, function* () {
            yield mongo.db.collection('sockets')
                .insertOne({
                socketId: socket.id,
                usuario: null
            })
                .then((result) => console.log(result))
                .catch((error) => console.log(error));
        }),
        signUp: (io, socket) => {
            socket.on('signUp', (payload) => __awaiter(void 0, void 0, void 0, function* () {
                //Agregar Payload al arreglo
                //userList.push(payload);
                yield mongo.db.collection('sockets')
                    .findOneAndUpdate({ socketId: socket.id }, { $set: { usuario: payload.email } })
                    .then((result) => console.log(result))
                    .catch((error) => console.log(error));
                //Guardar en base de datos
                yield mongo.db.collection('usuarios').findOneAndUpdate({ correo: payload.email }, //Criterio de busqueda
                {
                    $setOnInsert: {
                        isVerify: false
                    },
                    $set: {
                        nombreCompleto: payload.fullName,
                        fotoURL: payload.photoUrl
                    }
                }, {
                    upsert: true
                })
                    .then((result) => console.log(result))
                    .catch((error) => console.log(error));
                /*))
                     //console.log(result);
                     
                     const response: any = await tokenHelper.create(payload, payload.apiKey);

                     if(response.ok) {
                         console.log(await tokenHelper.verify(response.token, payload.apiKey));
                     }

                 })
                 .catch((error: any) => console.log(error)); */
                userList.push(payload);
                //Retransmitir la variable payload a todos los clientes registrados
                io.emit('broadcast-message', userList);
            }));
        },
        disconnect: (socket) => {
            socket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
                console.log(`Desconeccion del cliente con ID: ${socket.id}`);
                //Eliminar socket desconectado
                yield mongo.db.collection('sockets')
                    .remove({ socketID: socket.id })
                    .then((result) => console.log(result))
                    .catch((error) => console.log(error));
                //console.log(`TO DO: Guardar Log en Base de Datos ${socket.id}`);
            }));
        }
    };
};
