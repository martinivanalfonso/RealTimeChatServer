const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const cors = require('cors')

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users')

const router = require('./router')

const PORT = process.env.PORT || 5000

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(router)
app.use(cors())


io.on('connection', (socket) => {
    socket.on('join', ({ name, room}, callback) => {
        const { user, error } = addUser(socket.id, name, room)
        if (error) return callback(error)

        socket.emit('message', { user: 'admin', text: `Hello ${user.name}, welcome to room: ${user.room}` })
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name}, has joined the room` })

        socket.join(user.room)

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('message', { user: user.name, text: message})
        io.to(user.room).emit('roomData',  { room: user.room, users: getUsersInRoom(user.room)})

        callback()
    })

    socket.on('seeUsersOnline', ({ name, room}, callback) => {
        const users = getUsersInRoom(room)

        users.map( userInTheRoom => {
            socket.emit('message', {user: name, text: `${userInTheRoom.name} is in the room`})
        })

        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left the room`})
        }
    })
})


server.listen(PORT, () => console.log(`Server has started on port: ${PORT}`))
