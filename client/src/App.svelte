<script>
  import { onMount } from "svelte";
  import Login from "./Users/Login.svelte";
  import Board from "./Board/Board.svelte";


  let loggedIn;


  onMount(async () => {
    const res = await fetch(
      "/checkLogin");
    const response = await res.json();
    if (response.logged_in) {
      loggedIn = true;
    } else {
      loggedIn = false;
    }
  });


  async function logoutUser() {
    loggedIn = false;
    const res = await fetch(`/logout`);
    const response = await res.json();
  }

</script>

{#if loggedIn == false}
  <Login
    on:login-user={(event) => loggedIn = event.detail.success} />
{:else if loggedIn}
  <Board on:logout-user={logoutUser} />
{:else}
 <div></div>
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
