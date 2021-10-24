const express = require('express')
const sqlite3 = require('sqlite3')
const app = express()
const port = 3000

let db = new sqlite3.Database('./data/sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    return console.error(err.message)
  }
  console.log('Connected to the SQlite database.')
})

function initDb(db) {
	db.run('CREATE TABLE IF NOT EXISTS songs(id INTEGER NOT NULL, name TEXT NOT NULL, artist TEXT NOT NULL, album TEXT NOT NULL, year INTEGER NOT NULL, image TEXT NOT NULL, audiosource TEXT NOT NULL, PRIMARY KEY(id, name))');
}

app.get('/', (req, res) => {
	res.send("Hello World From Cosmo Media Server")
})

app.get('/songs', (req, res) => {
	let sql = `SELECT name FROM songs
           ORDER BY name`;

db.all(sql, [], (err, rows) => {
  if (err) {
    throw err;
  }
  rows.forEach((row) => {
    res.send(row.name);
  });
});
})

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
	initDb(db)
})
