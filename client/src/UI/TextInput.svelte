<script>

  export let type = "text";
  export let placeholder;

</script>

<input type={type} placeholder={placeholder}>

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
  color: hsla(0, 0%, 20%, .5);
}

</style>
