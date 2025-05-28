async function sendPostData() {
  try {
    const response = await fetch("http://localhost:3000/postinsert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ownerAccountID: "acc4",
        text: "Switzerland is a beautiful country.",
        postType: "Story",
        expiresAt: "2025-12-31T23:59:59Z",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Response Data:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

export default sendPostData;
