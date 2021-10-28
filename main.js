const express = require('express');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const nocache = require('nocache');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(nocache());
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

	db.exec(`CREATE TABLE IF NOT EXISTS playlists(
		id INTEGER NOT NULL PRIMARY KEY,
		name TEXT NOT NULL,
		songs TEXT NOT NULL
	)`);
}

app.get('/api/songs', (req, res) => {
	const stmt = db.prepare('SELECT * FROM songs ORDER BY id LIMIT ?');
	let amount = req.query.amount;
	if (amount == undefined||amount == null) {
		amount = 25;
	} else if (amount == 'ALL') {
		amount = getHighestId('songs');
	}
	const songs = stmt.all(amount);
	res.status(200).send(JSON.stringify(songs));
});

app.get('/api/songs/:id', (req, res) => {
	const stmt = db.prepare('SELECT * FROM songs WHERE id=? LIMIT 1');
	let id = req.params.id;
	const songs = stmt.all(id);
	if (songs.length == 0) {
		res.status(404).send('404 playlist not found');
	} else {
		res.status(200).send(JSON.stringify(songs[0]));
	}
});

app.get('/api/search/songs', (req, res) => {
	let results;
	let keyword = req.query.keyword;
	const exact = req.query.exact;
	if (exact != 'yes') {
		keyword = '%'+keyword+'%';
	}
	switch (req.query.mode) {
	case 'name': {
		const stmt = db.prepare('SELECT * FROM songs WHERE (name LIKE ?)');
		results = stmt.all(keyword);
		break;
	}
	case 'album': {
		const stmt = db.prepare('SELECT * FROM songs WHERE (album LIKE ?)');
		results = stmt.all(keyword);
		break;
	}
	case 'artist': {
		const stmt = db.prepare('SELECT * FROM songs WHERE (artist LIKE ?)');
		results = stmt.all(keyword);
		break;
	}
	case 'year': {
		const stmt = db.prepare('SELECT * FROM songs WHERE (artist LIKE ?)');
		results = stmt.all(keyword);
		break;
	}
	default: {
		// eslint-disable-next-line max-len
		res.status(403).send('403 Bad Request');
		return;
	}
	}
	res.status(200).send(results);
});

app.get('/api/playlists', (req, res) => {
	const stmt = db.prepare('SELECT * FROM playlists ORDER BY id LIMIT ?');
	let amount = req.query.amount;
	if (amount == undefined||amount == null) {
		amount = 25;
	} else if (amount == 'ALL') {
		amount = getHighestId('playlists');
	}
	const playlists = stmt.all(amount);
	res.status(200).send(JSON.stringify(playlists));
});

app.get('/api/playlists/:id', (req, res) => {
	const stmt = db.prepare('SELECT * FROM playlists WHERE id=? LIMIT 1');
	let id = req.params.id;
	const playlists = stmt.all(id);
	if (playlists.length == 0) {
		res.status(404).send('404 song not found');
	} else {
		res.status(200).send(JSON.stringify(playlists[0]));
	}
});

app.post('/api/playlists', (req, res) => {
	const stmt = db.prepare('INSERT INTO playlists VALUES (?,?,?)');
	const highest = getHighestId('playlists');
	const id = highest+1;
	const name = req.query.name;
	stmt.run(
		id, name, '[]'
	);
	res.status(200).send('200 OK');
});


app.delete('/api/playlists/:id', (req, res) =>{
	const id = req.params.id;
	const song = parseInt(req.query.song);
	delSongFromPlaylist(song, id);
	res.status(200).send('200 OK');
});

app.put('/api/playlists/:id', (req, res) =>{
	const id = req.params.id;
	const song = parseInt(req.query.song);
	addSongToPlaylist(song, id);
	res.status(200).send('200 OK');
});

app.post('/api/songs', function(req, res) {
	if (!req.files || Object.keys(req.files).length === 0) {
		return res.status(400).send('No files were uploaded.');
	}
	let songFile = req.files.songFile;
	let image = req.files.image;
	const highestId = getHighestId('songs');
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
		image.name, 
		songFile.name
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


function getHighestId(table) {
	const stmt = db.prepare('SELECT MAX(id) AS max_id FROM ' + table);
	const max_id = stmt.get().max_id;
	if (max_id == undefined) {
		return 0;
	} else {
		return max_id;
	}
}

function addSongToPlaylist(songID, playlistID) {
	const stmt = db.prepare('SELECT * FROM playlists WHERE id=?');
	const songs = stmt.get(playlistID).songs;
	let parsed = JSON.parse(songs);
	parsed.push(songID);
	const string = JSON.stringify(parsed);
	const stmt2 = db.prepare('UPDATE playlists SET songs=? WHERE id=?');
	stmt2.run(string, playlistID);
}

function delSongFromPlaylist(songID, playlistID) {
	const stmt = db.prepare('SELECT * FROM playlists WHERE id=?');
	const songs = stmt.get(playlistID).songs;
	let parsed = JSON.parse(songs);
	
	let removeValFromIndex = [];
	for (let i = parsed.length; i>0; i--) {
		if (parsed[i] == songID) removeValFromIndex.push(i);
	}
	for (var i = removeValFromIndex.length -1; i >= 0; i--) {
		parsed.splice(removeValFromIndex[i],1);
	}
	const string = JSON.stringify(parsed);
	const stmt2 = db.prepare('UPDATE playlists SET songs=? WHERE id=?');
	stmt2.run(string, playlistID);
}