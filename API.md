# API routes, paths and other definitions

## All api paths begin with /api/

**GET /api/songs**
Returns all songs
<br>
Optional Query parameters: 
* amount -> limits the number of songs. Default: 25

**GET /api/songs/:id**
Return information for the song with the specified ID

**GET /api/playlists**
Returns all playlists
<br>
Optional Query parameters:
* amount -> limits the number of songs. Default: 25

**GET /api/playlists/:id**
Return information for the playlist with the specified ID
<br>
Example response:
<br>
```json
{
  "id": 1,
  "name": "First Playlist",
  "songs": "[8,4]"
}
```

**POST /api/songs**
Upload a new song, see [UPLOADING.md](/UPLOADING.md)

**POST /api/playlists**
Create a new playlist.
<br>
Parameters:
* name: playlist name

**PUT /api/playlists/:id**
Add a song to the playlist with the specified ID
<br>
Parameters:
* song: song ID
