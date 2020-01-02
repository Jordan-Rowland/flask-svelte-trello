<script>

  export let type = "text";
  export let placeholder;
  export let value;
  export let classes = "";


</script>

<input
  class={classes}
  {type}
  {placeholder}
  {value}
  on:input>

<style>

input {
  height: 35px;
  max-width: 65%;
  color: hsla(0, 0%, 0%, .90);
  border: none;
  outline: none;
  border-bottom: 1px solid #ccc;
  background-color: hsla(0, 0%, 0%, 0);
}

input::placeholder {
  color: hsla(0, 0%, 20%, .60);
}

.long {
  width: 20rem;
}

.longer {
  width: 30rem;
}

.margin-left {
  margin: 0 0.35rem;
}

.inline {
  display: inline-flex;
}

</style>
