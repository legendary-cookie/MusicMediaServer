const express = require('express');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express();
const port = 3000;


app.use(cors());
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
	const stmt = db.prepare('SELECT * FROM songs ORDER BY name LIMIT ?');
	let amount = req.query.amount;
	if (amount == undefined||amount == null) {
		amount = 10;
	}
	const songs = stmt.all(amount);
	res.status(200).send(JSON.stringify(songs));
});


function getHighestId() {
	const stmt = db.prepare('SELECT MAX(id) AS max_id FROM songs');
	const max_id = stmt.get().max_id;
	if (max_id == undefined) {
		return 0;
	} else {
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
	console.log(`Server listening at http://localhost:${port}`);
	initDb(db);
});
