<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  let email = "jordanrowland00@gmail.com";
  let password = "mypassword";
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
<input type="text" name="email" bind:value={email}>
</label>

<label>
Password<br>
<input type="password" name="password" bind:value={password}>
</label>
<button type="submit"
  on:click|preventDefault={loginUser}>
  Login
</button>

</form>
</div>
</div>


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
