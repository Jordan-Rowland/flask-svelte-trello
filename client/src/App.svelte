<script>
  import Login from "./Users/Login.svelte";
  import Board from "./Board.svelte";


  let loggedIn;


  async function logoutUser() {
    loggedIn = false;
    const res = await fetch(`/logout`);
    const response = await res.json();
  }

</script>

{#if !loggedIn}
  <Login
    on:login-user={(event) => loggedIn = event.detail.success} />
{:else}
  <Board on:logout-user={logoutUser} />
{/if}


<style>

:global(body) {
  margin: 0;
  background-color: hsl(170, 45%, 95%);
}

:global(*) {
  /*font-family: 'Lato', sans-serif;*/
  /*font-family: 'Mansalva', cursive;*/
}

button:hover {
  cursor: pointer;
}

</style>
