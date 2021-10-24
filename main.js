const express = require('express')
const sqlite3 = require('sqlite3')
const app = express()
const port = 3000

let db = new sqlite3.Database

app.get('/', (req, res) => {
	res.send("Hello World From Cosmo Media Server");
})

app.get('/songs', (req, res) => {
		
})

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})
