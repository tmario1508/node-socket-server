import { Socket } from "socket.io"

let userList: any[] = [];

export default (mongo: any) => {

    return {
        signUp: (io: any, socket: Socket) =>{
            socket.on('signUp', async (payload: any) =>{
                //Agregar Payload al arreglo
                //userList.push(payload);

                //Guardar en base de datos
                await mongo.db.collection('usuarios').findOneAndUpdate(
                        { correo: payload.email }, //Criterio de busqueda
                        {
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
                    .then((error: any) => console.log(error));

                userList.push(payload);
                
                //Retransmitir la variable payload a todos los clientes registrados
                io.emit('broadcast-message', userList);
            });
        },
        disconnect: (socket: Socket) =>{
            socket.on('disconnect', () => {
                console.log(`Desconeccion del cliente con ID: ${socket.id}`);

                console.log(`TO DO: Guardar Log en Base de Datos ${socket.id}`);
            });
        }
    }
};