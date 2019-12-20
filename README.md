# flask-svelte-trello
Trello clone prototype build with Svelte.js and Flask(Python)

![Svelte Trello Clone](https://i.postimg.cc/6QgqVZkD/Screenshot-2019-12-19-at-9-49-16-PM.png)

This is a note-card/trello clone prototype project to experiment with wiring up Flask and Svelte.js together. Flask serves up API endpoints that attach to the in-memory database(sqlite3), and all front-end views/functions are handled in Svelte.js.

Currently, this supports creating new lists, with simple notes that attach and stay in their designated list. 

Lists will keep adding to the right and you can scroll to see them. 

TODO:
- Allow user login
- Editable notes
- Drag and Drop functionality
- Postgres database
- Put up on Heroku
