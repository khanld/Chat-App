const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const sever = http.createServer(app)
const io = socketio(sever)
const {generateMessage, generateLocationMessage} = require('./utils/messages')

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {


	socket.on('sendMessage', (message, cb) => {
		const user = getUser(socket.id)

		io.to(user.room).emit('message', generateMessage( user.username ,message))

		cb('Delivered')
	})

	socket.on('disconnect', () => {
		const user = removeUser(socket.id)

		if (user) {
			io.to(user.room).emit('message', generateMessage( user.username, `${user.username} has left!`))
			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUsersInRoom(user.room)
			})
		}

		
	})

	socket.on('sendLocation', ({lat, long}, cb) => {
		const user = getUser(socket.id)

		io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${lat},${long}`))
		cb()
	})

	socket.on('join', (options, cb) => {
		const { error, user } = addUser({ id: socket.id, ...options })

		if (error) {
			return cb(error)
		}

		socket.join(user.room)

		socket.emit('message', generateMessage("ADMIN",'WelCome!'))
		socket.broadcast.to(user.room).emit('message',generateMessage(`${user.username} has join`))
		io.to(user.room).emit('roomData', {
			room: user.room,
			users: getUsersInRoom(user.room)
		})

		cb()
	})
})

sever.listen(port, () => {
	console.log('Sever is now available at ' + port)
})