# flask-svelte-trello
Trello clone prototype build with Svelte.js and Flask(Python)

![Svelte Trello Clone](https://i.postimg.cc/GhB9gqQH/Screenshot-2019-12-19-at-9-28-00-PM.png)

This is a note-card/trello clone prototype project to experiment with wiring up Flask and Svelte.js together. Flask serves up API endpoints that attach to the in-memory database(sqlite3), and all front-end views/functions are handled in Svelte.js.

Currently, this supports creating new lists, with simple notes that attach and stay in their designated list. 

TODO:
- Allow user login
- Editable notes
- Drag and Drop functionality
