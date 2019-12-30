<script>
  import { onMount } from "svelte";
  import Login from "./Users/Login.svelte";
  import Board from "./Board/Board.svelte";
  import Error from "./UI/Error.svelte";

  let errorMessage;
  let errorShow;


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

  function displayError(event) {
    errorMessage = event.detail;
    errorShow = true;
  }

</script>

{#if loggedIn == false}
  <Login
    on:login-user={(event) => loggedIn = event.detail.success}
    on:display-error={displayError} />
{:else if loggedIn}
  <Board on:logout-user={logoutUser}
    on:display-error={displayError} />
{:else}
 <div></div>
{/if}

<Error show={errorShow} message={errorMessage}
  on:close-error={() => errorShow = false} />

<style>

:global(body) {
  margin: 0;
  background-color: hsl(170, 45%, 95%);
}

:global(:root) {
  --theme-color: hsl(228, 100%, 61%);
}

:global(*) {
  /*font-family: 'Lato', sans-serif;*/
  /*font-family: 'Mansalva', cursive;*/
}

button:hover {
  cursor: pointer;
}

</style>
