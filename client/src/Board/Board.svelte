<script>
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  import List from "./List.svelte";


  onMount(() => {
    getLists();
  });

  let lists = [];
  let listName;


  async function getLists() {
    const res = await fetch(
      "/lists");
    const response = await res.json();
    lists = response.lists;
  }


  async function addList() {
    const res = await fetch(
      "/addList", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({name: listName}),
      }
    );
    const response = await res.json();
    if (!response.success) {
      dispatch("display-error", response.message);
      return false;
    }
    lists = [...lists, response.list];
    listName = "";
  }


  async function deleteList(event) {
    const selectedId = event.detail;
    const res = await fetch(
      `/deleteList/${selectedId}`, {method: "DELETE"}
    );
    const response = await res.json();
    if (!response.success) {
      dispatch("display-error", response.message);
      return false;
    }
    const updatedLists = lists.filter(
      list => list.id !== selectedId
    );
    lists = updatedLists;
  }


  async function logoutUser() {
    dispatch("logout-user");
    const res = await fetch(`/logout`);
    const response = await res.json();
  }


</script>

  <div class="header">
    <!-- <input type="text" name="newList" bind:value={listName} placeholder="New List Name">
    <button
      on:click={addList}>Add List</button> -->
    <div class="logout-button">
      <button
        on:click={logoutUser}>Log Out</button>
    </div>
  </div>

  <div class="column">
  {#if lists}
    {#each lists as list, index (list.id)}
      <List name={list.name} id={list.id}
        on:delete-list={deleteList}
        on:display-list-error={event => dispatch("display-error", event.detail)} />
    {/each}
  {/if}

  <div class="new-list">
    <input type="text" name="newList" bind:value={listName} placeholder="New List Name">
    <button on:click={addList}>Add List</button>
  </div>

  </div>

<style>

:global(body) {
  margin: 0;
  background-color: hsl(170, 45%, 95%);
}

:global(*) {
  /*font-family: 'Lato', sans-serif;*/
  /*font-family: 'Mansalva', cursive;*/
}

.header {
  position: fixed;
  width: 100%;
  display: flex;
  top: 0;
  left: 0;
  background-color: hsla(228, 100%, 61%, 1);
  justify-content: flex-end;
  align-content: center;
}

.header button {
  margin: 9px;
  border-radius: 3px;
  margin-left: 0.35rem;
}

.column {
  display: flex;
  justify-content: flex-start;
  margin-top: 50px;
}

.column input, .column button {
  margin-top: 0.55rem;
  height: 35px;
  margin-left: 0.35rem;
}

button:hover {
  cursor: pointer;
}

.logout-button {
  right: 0.35rem;
}

.new-list {
  display: flex;
  /*height: px;*/
  margin-top: 10px;
}

</style>
