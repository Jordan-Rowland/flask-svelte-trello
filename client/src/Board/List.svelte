<script>
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  const dispatch = createEventDispatcher();

  import { fetchGet, fetchPost } from "../helpers.js";
  import Note from "./Note.svelte";
  import Button from "../UI/Button.svelte";
  import TextInput from "../UI/TextInput.svelte";


  export let id;
  export let name;

  let notes = [];
  let newNote = "";

  onMount(() => {
    getNotes();
  });


  async function getNotes() {
    const response = await fetchGet(`/list/${id}/notes`);
    if (!response.success) {
      dispatch("display-error", response.message);
      return false;
    }
    notes = response.notes;
  }


  async function addNote() {
    const response = await fetchPost(
      "/addNote", {body: newNote, list_id: id}
    );
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
    // alert("Make this pop up a drop-down display for deleting?");
    dispatch("delete-list", id);
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
      on:click={deleteList}>✕</span>
  </div>
</div>
{#if notes}
  {#each notes as note (note.id)}
    <Note noteBody={note.body} id={note.id}
      on:delete-note={deleteNote}
      on:display-error={event => dispatch("display-list-error", event.detail)} />
  {/each}
{/if}
<div class="new-note">
  <form>
    <TextInput
      classes={"margin-left"}
      placeholder="Enter card title"
      on:input={event => newNote = event.target.value}
      value={newNote} />
    <Button
      type="submit"
      on:click={addNote}>
        Add Note
    </Button>
  </form>
</div>
</div>
</section>

<style>

.name {
  /*background-color: hsl(205, 76%, 39%);*/
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  padding: 5px;
  margin: 5px;
  color: #010;
  font-weight: 800;
}

.delete-list {
  background-color: var(--theme-color);
  padding: 0.15rem 0.35rem;
  border-radius: 3px;
  /*visibility: hidden;*/
}

.delete-list:hover {
  cursor: pointer;
  visibility: inherit;
}

.list {
  background-color: var(--theme-color);
  margin: 20px;
  display: flex;
  flex-direction: column;
  width: 22vw;
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

input {
  max-width: 65%;
  color: #ccc;
}

</style>
