<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  import Button from "../UI/Button.svelte";


  export let note;

  const closeModal = () => {
    dispatch("cancel-modal");
  };

</script>

<div class="backdrop" on:click={closeModal}></div>
<div class="modal">
  <span class="close-modal" on:click={closeModal}>✕</span>
  <textarea rows="10" on:input={event => note = event.target.value}>{note}</textarea>
  <br>
  <Button on:click={() => dispatch("save-edit-note", note)}>Save</Button>
  <Button on:click={() => dispatch("delete-note", note)}>Delete</Button>
</div>



<style>
.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  /*background: rgba(0, 0, 0, 0.75);*/
  z-index: 10;
}

.modal {
  padding: 1rem;
  position: absolute;
  width: 80%;
  background: white;
  border-radius: 5px;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
  overflow: scroll;
  margin: auto;
}

.close-modal {
  position: absolute;
  right: 10px;
  top: 10px;
}

.close-modal:hover {
  cursor: pointer;
}

textarea {
  width: 90%;
  height: 80%;
  border: none;
  outline: none;
}

</style>
