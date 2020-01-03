<script>
  import { scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  import { fetchPost } from "../helpers.js";
  import { createEventDispatcher } from "svelte";
  let dispatch = createEventDispatcher();

  import EditNote from "./EditNote.svelte";



  export let noteBody;
  export let id;

  let editNote = false;

  function deleteNote() {
    dispatch("delete-note", id);
  }

  async function saveEditNote(event) {
    const response = await fetchPost(
      `/editNote/${id}`, {body: event.detail.trim()}
    );
    if (!response.success) {
      dispatch("display-error", response.message);
      return false;
    }
    noteBody = event.detail;
    editNote = false;
  }

</script>

<div id="note"
  transition:scale="{{duration: 250, delay: 10, opacity: 0.5, start: 0.5, easing: quintOut}}">
  {#if editNote}
    <EditNote note={noteBody}
      on:cancel-modal={() => editNote = false}
      on:save-edit-note={saveEditNote}
      on:delete-note={deleteNote} />
  {/if}
  <div class="note-body">
    {noteBody}
  </div>
  <div class="edit-button">
    <button on:click={() => editNote = true}>✎</button>
    <!-- <button on:click={deleteNote}>✕</button> -->
  </div>
</div>

<style>

#note {
  background-color: hsl(258, 100%, 99%);
  position: relative;
  display: inline-block;
  box-shadow: 1px 2px 3px 0 rgba(0,0,0,0.2);
  padding: 12px;
  min-width: 25%;
  margin: 0.25rem 0.65rem;
  border-radius: 3px;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.note-body {
  display: inline-block;
  overflow-wrap: break-word;
  word-wrap: break-word;
  width: 90%;
}

.edit-button {
  display: none;
}

#note:hover .edit-button {
  display: flex;
}

button {
  display: inline;
  position: absolute;
  top: 7px;
  right: 6px;
  border: none;
  background-color: hsl(258, 100%, 99%);
  border-radius: 3px;
  padding: 0.02rem 0.35rem;
  }

button:hover {
  cursor: pointer;
  background-color: hsl(258, 10%, 89%);
}

</style>
