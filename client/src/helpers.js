// export let id;
// export let newNote;


// export async function addNote() {
//     const res = await fetch(
//       "/addNote", {
//         method: "POST",
//         headers: {
//           'Content-Type': 'application/json',
//           'Accept': 'application/json'
//         },
//         body: JSON.stringify({body: newNote, list_id: id}),
//       }
//     );
//     const response = await res.json();
//     if (!response.success) {
//       dispatch("display-list-error", response.message);
//       return false;
//     }
//     notes = [...notes, response.note];
//     newNote = "";
//   }


export async function fetchGet(url) {
  const res = await fetch(url);
  const response = await res.json();
  return response;
}

export async function fetchPost(url, data) {
  const res = await fetch(
    url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data),
  });
  const response = await res.json();
  return response;
}

// export async function fetchPut() {}
