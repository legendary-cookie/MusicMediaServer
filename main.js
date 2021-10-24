const express = require('express');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(fileUpload());
app.use(express.static('public'));
app.use(express.static('data'));
app.use(bodyParser.urlencoded({extended: false}));

const db = require('better-sqlite3')('./data/sqlite.db');

function initDb(db) {
	db.exec(`CREATE TABLE IF NOT EXISTS songs(
          id INTEGER NOT NULL, 
          name TEXT NOT NULL, 
          artist TEXT NOT NULL, 
          album TEXT NOT NULL, 
          year INTEGER NOT NULL, 
          image TEXT NOT NULL, 
          audiosource TEXT NOT NULL, 
          PRIMARY KEY(id))`,
	);
}

app.get('/', (req, res) => {
	res.send('Hello World From Cosmo Media Server');
});

app.get('/songs', (req, res) => {
	const sql = `SELECT name FROM songs
           ORDER BY name`;

	db.all(sql, [], (err, rows) => {
		if (err) {
			return res.status(501).send(err);
		}
		let data = [];
		rows.forEach((row) => {
			data.push({
				id: row.id,
				name: row.name,
				artistName: row.artist,
				albumName: row.album,
				year: row.year,
				src: row.image,
				songSrc: row.audiosource
			});
		});
		res.send(JSON.stringify(data));
	});
});


function getHighestId() {
	const stmt = db.prepare('SELECT MAX(id) AS max_id FROM songs');
	const max_id = stmt.get().id;
	if (max_id == undefined) {
		console.log('No entries, max id is 0 now');
		return 0;
	} else {
		console.log('Highest ID is ' + max_id);
		return max_id;
	}
}

app.post('/song', function(req, res) {
	if (!req.files || Object.keys(req.files).length === 0) {
		return res.status(400).send('No files were uploaded.');
	}
	// The name of the input field (i.e. "sampleFile") 
	//  is used to retrieve the uploaded file
	let songFile = req.files.songFile;
	let image = req.files.image;
	const highestId = getHighestId();
	const id = highestId + 1;
	const relPath = 'songs/' + id + '/';
	const uploadPath = __dirname + '/data/' + relPath;
	fs.mkdirSync(uploadPath, { recursive: true });
	let errs = [];
	image.mv(uploadPath + image.name, function(err) {
		if (err) errs.push(err);
	});
	songFile.mv(uploadPath + songFile.name, function(err) {
		if (err) errs.push(err);
	});
	
	let stmt = db.prepare('INSERT INTO songs VALUES (?,?,?,?,?,?,?)');
	stmt.run(
		id, req.body.name, req.body.artist, 
		req.body.album, req.body.year, 
		'http://localhost:3000/'+relPath+image.name, 
		'http://localhost:3000/'+relPath+songFile.name
	);
	if (errs.length > 0) {
		return res.status(500).send(JSON.stringify(errs));
	} else {
		return res.status(200).send('200 OK');	
	}
});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
	initDb(db);
});
