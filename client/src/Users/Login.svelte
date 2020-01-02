<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  import { fetchPost } from "../helpers.js";
  import Button from "../UI/Button.svelte";
  import TextInput from "../UI/TextInput.svelte";


  let email = "";
  let password = "";
  let confirmPassword = "";
  let login = true;


  async function loginUser() {
    const response = await fetchPost(
      "/login", {email: email, password: password}
    );
    if (!response.success) {
      dispatch("display-error", response.message);
      return false;
    }
    dispatch("login-user", response);
  }


  async function signUpUser() {
    if (password !== confirmPassword) {
      dispatch("display-error", "Passwords do not match");
      return false;
    }
    const response = await fetchPost(
      "/signup", {email: email, password: password}
    );
    if (!response.success) {
      dispatch("display-error", response.message);
      return false;
    }
    errorShow = false;
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

<TextInput
  classes={"longer"}
  type="email"
  placeholder="Enter your email"
  on:input={event => email = event.target.value}
  value={email} />

</label>

<label>
Password<br>

<TextInput
  classes={"longer"}
  type="password"
  placeholder="Enter your password"
  on:input={event => password = event.target.value}
  value={password} />

</label>

{#if !login}
<label>
Confirm Password<br>
<TextInput
  classes={"longer"}
  type="password"
  placeholder="Enter your password again"
  on:input={event => confirmPassword = event.target.value}
  value={confirmPassword} />

</label>

<Button type="submit"
  on:click={signUpUser}>
    Sign Up
</Button>

{:else}

<Button type="submit"
  on:click={loginUser}>
    Login
</Button>

{/if}

<label>
Login
<input type="checkbox" name="login" bind:checked={login}>
</label>

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
  position: relative;
  margin: 4rem auto;
  left: 85px;
}

label {
  margin-bottom: 1.5rem;
}

</style>
