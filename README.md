# flask-svelte-trello
Trello clone prototype build with Svelte.js and Flask(Python)

![Svelte Trello Clone](https://i.postimg.cc/6QgqVZkD/Screenshot-2019-12-19-at-9-49-16-PM.png)

https://svello.herokuapp.com/

This is a note-card/trello clone prototype project to experiment with wiring up Flask and Svelte.js together. Flask serves up API endpoints that attach to the in-memory database(sqlite3), and all front-end views/functions are handled in Svelte.js.

Currently, this supports creating new lists, with simple notes that attach and stay in their designated list. 

Lists will keep adding to the right and you can scroll to see them. 

## UPDATE 12/22:
Svello now has user-logins integrated. If you do not want to sign up, and just want to see how this works, please use the following credentials:

email: githubuser@noemail.com
pass: githubpassword

Database has also been migrated from SQLite3 to PostGres, so all notes, lists, and users will persist. Given the state of the project, do not rely on this at this time because notes and lists and users may be deleted while further development is done. 

TODO:
- Multiple boards for each user
- UI overhaul and polish
- Editable notes
- Drag and Drop functionality/re-order lists and notes
