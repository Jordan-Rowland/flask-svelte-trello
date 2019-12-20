export async function getNotes() {
  const res = await fetch(
    "http://localhost:3000/notes");
  const resJson = await res.json();
  let notes = resJson.notes;
  console.log(`from helper: ${notes}`);
  return notes;
}


export async function addNote(newNote) {
  const res = await fetch(
    "http://localhost:3000/addNote", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({body: newNote}),
    });
  newNote = "";
  return [...notes, await res.json()];
}


async function deleteNote(event) {
  const selectedId = event.detail;
  const res = await fetch(
    `http://localhost:3000/deleteNote/${selectedId}`, {method: "DELETE"}
  );
  console.log(await res);
  let updatedNotes = notes.filter(
    note => note.id !== selectedId
  );
  notes = updatedNotes;
}
