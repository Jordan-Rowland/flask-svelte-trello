<script>
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  let dispatch = createEventDispatcher();

  import Note from "./Note.svelte";


  export let id;
  export let name;

  let notes = [];
  let newNote;

  onMount(() => {
    getNotes();
  });


  async function getNotes() {
    const res = await fetch(
      `/list/${id}/notes`);
    const response = await res.json();
    console.log(response);
    if (!response.success) {
      dispatch("display-error", response.message);
      return false;
    }
    console.log(response.notes);
    notes = response.notes;
  }


  async function addNote() {
    const res = await fetch(
      "/addNote", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({body: newNote, list_id: id}),
      }
    );
    const response = await res.json();
    if (!response.success) {
      dispatch("display-list-error", response.message);
      return false;
    }
    notes = [...notes, response.note];
    newNote = "";
  }


  async function deleteNote(event) {
    const selectedId = event.detail;
    const res = await fetch(
      `/${id}/deleteNote/${selectedId}`, {method: "DELETE"}
    );
    const updatedNotes = notes.filter(
      note => note.id !== selectedId
    );
    notes = updatedNotes;
  }


  function deleteList() {
    alert("Make this pop up a modal for deleting?");
    // dispatch("delete-list", id);
  }

</script>

<section
  transition:slide="{{delay: 50, duration: 185, easing: quintOut }}">
<div class="list">
<div>
  <div class="name">
    <span class="list-name">
      {name}
    </span>
    <span class="delete-list"
      on:click={deleteList}>+</span>
  </div>
</div>
{#if notes}
  {#each notes as note (note.id)}
    <Note noteBody={note.body} id={note.id}
      on:delete-note={deleteNote}/>
  {/each}
{/if}
<div class="new-note">
  <input type="text" name="new-note" bind:value={newNote}>
  <button on:click={addNote}>Add Note</button>
</div>
</div>
</section>

<style>

.name {
  background-color: hsla(230, 80%, 30%, 1);
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  padding: 5px;
  margin: 5px;
  color: hsla(258, 100%, 99%, 1);
  font-weight: 800;
}

.delete-list {
  background-color: hsla(228, 100%, 61%, 1);
  /*background-color: hsla(228, 100%, 21%, 1);*/
  padding: 0.15rem 0.35rem;
  border-radius: 3px;
  /*visibility: hidden;*/
}

.delete-list:hover {
  cursor: pointer;
  visibility: inherit;
}

.list {
  background-color: hsla(228, 100%, 61%, 1);
  margin: 20px;
  display: flex;
  flex-direction: column;
  min-width: 21vw;
  max-width: 35vw;
  border-radius: 3px;
}

.list-name {
  margin-left: 5px;
}

.new-note {
  margin: 10px auto;
  display: flex;
  justify-content: space-around;
}

button {
  border-radius: 3px;
  margin-left: 0.35rem;
  }

button:hover {
  cursor: pointer;
}

input {
  /*border-radius: 3px;*/
  max-width: 65%;
  color: #ccc;
}

</style>
