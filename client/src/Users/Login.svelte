<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  import Error from "../UI/Error.svelte";

  let errorMessage;
  let errorShow;

  $: console.log(errorShow);


  let email;
  let password;
  let confirmPassword;
  let login = true;


  async function loginUser() {
    const res = await fetch(
      "/login", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({email: email, password: password}),
      }
    );
    const response = await res.json();
    if (!response.success) {
      console.log("Login or signup failed");
      return false;
      // Throw error
    }
    dispatch("login-user", response);
  }


  async function signUpUser() {
    if (password !== confirmPassword) {
      // console.log("Passwords dont match");
      errorMessage = "Passwords do not match";
      errorShow = true;
      return false;
    }
    const res = await fetch(
      "/signup", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({email: email, password: password}),
      }
    );
    const response = await res.json();
    if (!response.success) {
      // console.log("Login or signup failed");
      errorMessage = response.message;
      errorShow = true;
      return false;
    }
    dispatch("login-user", response);
  }

</script>

<div id="card">
<div class="header">
{#if login}
  <h1>Login</h1>
{:else}
  <h1>Sign Up</h1>
{/if}
  </div>
<hr>
<div class="form">
<form>
<label>
Email<br>
<input type="email" name="email" bind:value={email}>
</label>

<label>
Password<br>
<input type="password" name="password" bind:value={password}>
</label>

{#if !login}
<label>
Confirm Password<br>
<input type="password" name="cPassword" bind:value={confirmPassword}>
</label>

<button type="submit"
  on:click|preventDefault={signUpUser}>
  Sign Up
</button>
{:else}
<button type="submit"
  on:click|preventDefault={loginUser}>
  Login
</button>
{/if}

<label>
Login
<input type="checkbox" name="login" bind:checked={login}>
</label>

</form>
</div>
</div>

<Error show={errorShow} message={errorMessage}
  on:close-error={() => errorShow = false} />


<style>

#card {
  background-color: hsla(258, 100%, 99%, 1);
  position: relative;
  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
  transition: 0.3s;
  padding: 12px;
  min-width: 25%;
  max-width: 30%;
  min-height: 20rem;
  margin: 5rem auto;
  border-radius: 3px;
}

.form {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

label {
  margin-bottom: 0.45rem;
}

</style>
