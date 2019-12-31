<script>
  import { scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  import { createEventDispatcher } from "svelte";
  let dispatch = createEventDispatcher();

  export let noteBody;
  export let id;

  function deleteNote() {
    dispatch("delete-note", id);
  }

</script>

  <div id="note"
    transition:scale="{{duration: 250, delay: 10, opacity: 0.5, start: 0.5, easing: quintOut}}">
    <div class="note-body">
      {noteBody}
    </div>
    <button on:click={deleteNote}>X</button>
  </div>


<style>

#note {
  background-color: hsl(258, 100%, 99%);
  position: relative;
  display: inline-block;
  box-shadow: 0px 1px 3px 0 rgba(0,0,0,0.2);
  transition: 0.3s;
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

button {
  position: absolute;
  top: 7px;
  right: 6px;
  border: none;
  background-color: hsl(258, 10%, 99%);
  border-radius: 3px;
  padding: 0.15rem 0.35rem;
  font-weight: 800;
  }

button:hover {
  cursor: pointer;
  background-color: hsl(258, 10%, 79%);
}

</style>
