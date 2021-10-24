const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const app = express();
const port = 3000;

app.use(fileUpload());
app.use(express.static('public'));
app.use(express.static('data'));
app.use(bodyParser.urlencoded({extended: false}));

const db = new sqlite3.Database(
	'./data/sqlite.db',
	sqlite3.OPEN_READWRITE,
	(err) => {
		if (err) {
			return console.error(err.message);
		}
		console.log('Connected to the SQlite database.');
	});

function initDb(db) {
	db.run(`CREATE TABLE IF NOT EXISTS songs(
          id INTEGER NOT NULL, 
          name TEXT NOT NULL, 
          artist TEXT NOT NULL, 
          album TEXT NOT NULL, 
          year INTEGER NOT NULL, 
          image TEXT NOT NULL, 
          audiosource TEXT NOT NULL, 
          PRIMARY KEY(id, name))`,
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
	db.each('SELECT * FROM songs ORDER BY id DESC LIMIT 0, 1', 
		function(err, row) {
			if (err) throw err;
			return row.id;
		}
	);
	return 0;	
}

app.post('/song', function(req, res) {
	let songFile;
	if (!req.files || Object.keys(req.files).length === 0) {
		return res.status(400).send('No files were uploaded.');
	}
	// The name of the input field (i.e. "sampleFile") 
	//  is used to retrieve the uploaded file
	songFile = req.files.songFile;
	console.log(req.body.name);	
	const id = getHighestId() + 1;
	const uploadPath = __dirname + '/data/songs/'+id+'/';
	
	songFile.mv(uploadPath + songFile.name, function(err) {
		if (err) return res.status(500).send(err);
		res.send('File uploaded!');
	});

});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
	initDb(db);
});
