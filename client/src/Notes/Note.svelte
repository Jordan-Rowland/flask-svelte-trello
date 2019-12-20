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
    {noteBody}
    <button on:click={deleteNote}>X</button>
  </div>


<style>

#note {
  background-color: hsla(258, 100%, 99%, 1);
  position: relative;
  display: flex;
  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
  transition: 0.3s;
  padding: 12px;
  min-width: 25%;
  min-height: 4rem;
  margin: 0.75rem;
  border-radius: 3px;
}

button {
  position: absolute;
  bottom: -2px;
  right: 6px;
  border: none;
  background-color: hsla(258, 100%, 89%, 1);
  border-radius: 3px;
  padding: 0.25rem;
  }

button:hover {
  cursor: pointer;
}

</style>
