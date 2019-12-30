<script>

  export let type = "text";
  export let placeholder;
  export let value;

</script>

<input type={type} placeholder={placeholder} on:input>

<style>

input {
  height: 35px;
  max-width: 65%;
  margin: 0 0.35rem;
  color: hsla(0, 0%, 0%, .90);
  border: none;
  outline: none;
  border-bottom: 1px solid #ccc;
  background-color: hsla(0, 0%, 0%, 0);
}

input::placeholder {
  color: hsla(0, 0%, 20%, .60);
}

</style>
