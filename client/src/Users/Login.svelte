<script>

  let email = "jordanrowland00@gmail.com";
  let password = "mypassword";

  async function login() {
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
    const response = await res.json()
    console.log(response);
  }

</script>

<form>
<label>
Email
<input type="text" name="email" bind:value={email}>
</label>

<label>
Password
<input type="password" name="password" bind:value={password}>
</label>
<button type="submit" on:click|preventDefault={login}>Login</button>
</form>


<style>



</style>
