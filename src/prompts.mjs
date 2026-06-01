export function buildKeywordPrompt(params) {
  let prompt = `Use x_keyword_search to search X/Twitter for: ${JSON.stringify(params.query)}`;

  if (params.from_date) {
    prompt += `\nFilter: only posts from ${params.from_date}`;
  }

  if (params.to_date) {
    prompt += ` to ${params.to_date}`;
  }

  prompt += "\nReturn results with: post content, author handle, date, and link.";
  return prompt;
}

export function buildSemanticPrompt(params) {
  return `Use x_semantic_search to find X/Twitter posts about: ${JSON.stringify(params.query)}\nReturn results with: post content, author handle, date, and link.`;
}

export function buildUserPrompt(params) {
  return `Use x_user_search to find the X/Twitter user ${JSON.stringify(params.username)}. Return their profile info and recent posts.`;
}

export function buildThreadPrompt(params) {
  return `Use x_thread_fetch to get the full thread from this X post: ${JSON.stringify(params.post_url)}\nInclude all replies in chronological order.`;
}
