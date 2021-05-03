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
let userList = [];
exports.default = (mongo) => {
    return {
        signUp: (io, socket) => {
            socket.on('signUp', (payload) => __awaiter(void 0, void 0, void 0, function* () {
                //Agregar Payload al arreglo
                //userList.push(payload);
                //Guardar en base de datos
                yield mongo.db.collection('usuarios').findOneAndUpdate({ correo: payload.email }, //Criterio de busqueda
                {
                    $set: {
                        nombreCompleto: payload.fullName,
                        fotoURL: payload.photoUrl
                    }
                }, {
                    upsert: true
                })
                    .then((result) => console.log(result))
                    .then((error) => console.log(error));
                userList.push(payload);
                //Retransmitir la variable payload a todos los clientes registrados
                io.emit('broadcast-message', userList);
            }));
        },
        disconnect: (socket) => {
            socket.on('disconnect', () => {
                console.log(`Desconeccion del cliente con ID: ${socket.id}`);
                console.log(`TO DO: Guardar Log en Base de Datos ${socket.id}`);
            });
        }
    };
};
