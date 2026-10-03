export function validateCredentials(username, password) {
  const cleanUsername = typeof username === "string" ? username.trim() : "";
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(cleanUsername)) {
    return { error: "Username must be 3–32 characters using letters, numbers, or underscores." };
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return { error: "Password must be between 8 and 128 characters." };
  }
  return { username: cleanUsername, password };
}

export function validateTaskText(text) {
  if (typeof text !== "string" || text.trim().length === 0) {
    return { error: "Task text cannot be empty." };
  }
  const cleanText = text.trim();
  if (cleanText.length > 500) {
    return { error: "Task text must be 500 characters or fewer." };
  }
  return { text: cleanText };
}