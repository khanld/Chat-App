const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
	// // //New message element
	// const $newMessage = $messages.lastElementChild

	// // //Height of the last message
	// const newMessageStyles = getComputedStyle($newMessage)
	// const newMessageMargin = parseInt(newMessageStyles.marginBottom)
	// const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
	
	// const visibleHeight = $messages.offsetHeight

	// //Height off messages container
	// const containerHeight = $messages.scrollHeight
	// //How far have i scrolled
	// const scrollOffset = $messages.scrollTop + visibleHeight


		$messages.scrollTop = $messages.scrollHeight
	
}

socket.on('message', (message) => {
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('k:m')
	})

	$messages.insertAdjacentHTML('beforeend', html)
	autoscroll()
})

$messageForm.addEventListener('submit', (e) => {
	e.preventDefault()

	$messageFormButton.disabled = true

	const message = e.target.elements.message.value
	socket.emit('sendMessage', message, (message) => {
		$messageFormButton.disabled = false
		$messageFormInput.value = ""
		console.log('Message delivered')
	})
})

socket.on('locationMessage', (message) => {
	const html = Mustache.render(locationTemplate, {
		username: message.username,
		location: message.url,
		createdAt: moment(message.createdAt).format('k:m')
	})

	$messages.insertAdjacentHTML('beforeend', html)
	autoscroll()
})
$sendLocationButton.addEventListener('click', (e) => {
	if (!navigator.geolocation)
		return alert('geolocation is not supported by your browser')

	$sendLocationButton.disabled = true

	navigator.geolocation.getCurrentPosition((position) => {
		socket.emit('sendLocation', {
			lat: position.coords.latitude,
			long: position.coords.longitude
		}, () => {
			$sendLocationButton.disabled = false
			console.log("Location is sent successfully")
		})
	})
})	


socket.emit('join', { username, room }, (error) => {
	if (error) {
		alert(error)
		location.href = '/'
	}
})


socket.on('roomData', ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users
	})

	document.querySelector('#sidebar').innerHTML = html
})