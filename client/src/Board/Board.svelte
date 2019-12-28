<script>
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  import List from "./List.svelte";
  import Button from "../UI/Button.svelte";
  import TextInput from "../UI/TextInput.svelte";


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
    <div class="logout-button">
      <Button text="Log Out"
        on:click={logoutUser} />
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
    <TextInput type="text" bind:value={listName} placeholder="New List Name" />
    <Button class="new-list-button" text="Add List" on:click={addList} />
  </div>

  </div>

<style>

:global(body) {
  margin: 0;
  background-color: hsl(170, 45%, 95%);
}

:global(:root) {
  --theme-color: hsl(228, 100%, 61%);
}

.header {
  position: fixed;
  width: 100%;
  display: flex;
  top: 0;
  left: 0;
  background-color: var(--theme-color);
  justify-content: flex-end;
  align-content: center;
}

.logout-button {
  position: relative;
  right: 3.5px;
  top: 3.5px;
}

.column {
  display: flex;
  justify-content: flex-start;
  margin-top: 50px;
}

.column input {
  margin: 0 0.35rem;
  height: 35px;
}

.new-list {
  display: flex;
  margin: 12px;
  margin-top: 1.2rem;
}

</style>
