<script>
  import { onMount } from "svelte";
  import List from "./Notes/List.svelte";

  onMount(() => {
    getLists();
  });

  let lists = [];
  let listName;

  async function getLists() {
    const res = await fetch(
      // "http://localhost:3000/lists");
      "/lists");
    const resJson = await res.json();
    lists = resJson.lists;
    console.log(lists);
  }

  async function addList() {
    const res = await fetch(
      // "http://localhost:3000/addList", {
      "/addList", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({name: listName}),
      }
    );
    lists = [...lists, await res.json()];
    listName = "";
  }


  async function deleteList(event) {
    const selectedId = event.detail;
    const res = await fetch(
      // `http://localhost:3000/deleteList/${selectedId}`, {method: "DELETE"}
      `/deleteList/${selectedId}`, {method: "DELETE"}
    );
    let updatedLists = lists.filter(
      list => list.id !== selectedId
    );
    lists = updatedLists;
  }

</script>

<div class="new-list">
  <input type="text" name="newList" bind:value={listName} placeholder="New List Name">
  <button
    on:click={addList}>Add List</button>
</div>

<div class="column">
{#if lists}
  {#each lists as list, index (list.id)}
    <List name={list.name} id={list.id}
      on:delete-list={deleteList} />
  {/each}
{/if}
</div>


<style>

:global(body) {
  margin: 0;
  background-color: hsl(170, 45%, 95%);
}

.column {
  display: flex;
  justify-content: flex-start;
  margin-top: 50px;
}

.new-list {
  position: fixed;
  width: 99%;
  display: flex;
  background-color: hsla(228, 100%, 61%, 1);
  border-radius: 3px;
  justify-content: center;
  align-content: center;
}

.new-list > input, button {
  margin: 9px;
  border-radius: 3px;
  margin-left: 0.35rem;
}

button:hover {
  cursor: pointer;
}

</style>
