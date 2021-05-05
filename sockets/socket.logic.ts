import { Socket } from "socket.io";
import TokenHelper from '../helpers/token.helper';
import ENV from '../enviroments/env';
import MongoHelper from '../helpers/mongo.helpers';

//const mongo = MongoHelper.getInstance(ENV.MONGODB);

let userList: any[] = [];

export default (mongo: any) => {

    return {
        listenSocketConnect: async (socket: Socket) => {
            await mongo.db.collection('sockets')
                .insertOne({
                    socketId: socket.id,
                    usuario: null
                })
                .then((result: any) => console.log(result))
                .catch((error: any) => console.log(error));
        },

        signUp: (io: any, socket: Socket) =>{
            socket.on('signUp', async (payload: any) =>{
                //Agregar Payload al arreglo
                //userList.push(payload);

                await mongo.db.collection('sockets')
                    .findOneAndUpdate(
                        { socketId: socket.id },
                        { $set: { usuario: payload.email }}
                    )
                    .then((result: any) => console.log(result))
                    .catch((error: any) => console.log(error));

                //Guardar en base de datos
                await mongo.db.collection('usuarios').findOneAndUpdate(
                        { correo: payload.email }, //Criterio de busqueda
                        {
                            $setOnInsert: {
                                isVerify: false  
                            },
                            $set: {
                                nombreCompleto: payload.fullName,
                                fotoURL: payload.photoUrl
                            }
                        },
                        {
                            upsert: true
                        }
                    )
                    .then((result: any) => console.log(result))
                    .catch((error: any) => console.log(error));
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
            });
        },
        disconnect: (socket: Socket) =>{
            socket.on('disconnect', async () => {
                console.log(`Desconeccion del cliente con ID: ${socket.id}`);
                
                //Eliminar socket desconectado
                await mongo.db.collection('sockets')
                    .remove({socketID: socket.id})
                    .then((result: any) => console.log(result))
                    .catch((error: any) => console.log(error))
                //console.log(`TO DO: Guardar Log en Base de Datos ${socket.id}`);
            });
        }
    }
};