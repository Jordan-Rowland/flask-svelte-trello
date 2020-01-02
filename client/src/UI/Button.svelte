<script>

  export let type = "button";
  export let classes = "";

</script>

<button
  class={classes}
  type={type}
  on:click|preventDefault>
    <slot />
</button>

<style>

button {
  width: 6.5rem;
  height: 2rem;
  border-radius: 3px;
  margin-left: 0.35rem; /* Not sure about only margin-left here */
  color: #333;
  background-color: #f4f4f4;
  outline: none;
}

button:hover {
  cursor: pointer;
}

.inline {
  display: inline;
}

</style>
