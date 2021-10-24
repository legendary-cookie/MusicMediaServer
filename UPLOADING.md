To upload you can either use something like curl or the provided upload.html page.
<br><br>
Example:
<br>
`curl -XPOST -F name="Solace Album Mix" -F songFile=@solace_mix.mp3 -F image=@solace.png -F artist="Monstercat" -F year=2012 -F album="Monstercat 007"  http://localhost:3000/song`
