<script>
  import { slide } from 'svelte/transition';
  import { circIn } from 'svelte/easing';
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();


  export let message;
  export let show;


  function closeError() {
    dispatch("close-error");
  }

</script>

{#if show}
<div class="container"
  in:slide="{{delay: 100, duration: 300, easing: circIn}}">
  <div class="error">
    <span class="error-close"
      on:click={closeError}>✕</span>
    <h4>{message}</h4>
  </div>
</div>
{/if}

<style>

.container {
  display: flex;
  justify-content: center;
}

.error {
  position: fixed;
  bottom: 0;
  background-color: #111;
  color: hsla(258, 100%, 99%, 1);
  padding: 1.5rem 5rem;
  border-radius: 3px;
}

.error-close {
  position: absolute;
  top: 5.5px;
  right: 8.5px;
  cursor: pointer;
}

</style>
