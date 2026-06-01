export function buildKeywordPrompt(params) {
  let prompt = `Use x_keyword_search to search X/Twitter for: ${JSON.stringify(params.query)}`;

  if (params.from_date) {
    prompt += `\nFilter: only posts from ${params.from_date}`;
  }

  if (params.to_date) {
    prompt += ` to ${params.to_date}`;
  }

  prompt += "\nReturn newest relevant results first. For each post include: exact visible post text, author handle, date/time, post link, and quoted/replied-to context when visible. If a post has no visible text, say \"no visible text\" instead of returning only a link.";
  return prompt;
}

export function buildSemanticPrompt(params) {
  return `Use x_semantic_search to find X/Twitter posts about: ${JSON.stringify(params.query)}
Return newest relevant results first. For each post include: exact visible post text, author handle, date/time, post link, and quoted/replied-to context when visible. If a post has no visible text, say "no visible text" instead of returning only a link.`;
}

export function buildUserPrompt(params) {
  return `Use x_user_search to find the X/Twitter user ${JSON.stringify(params.username)}.
Return:
1. Profile: display name, handle, verification status, follower count, bio, and profile link.
2. Recent posts, newest first. For each post include exact visible post text, author handle, date/time, post link, and whether it is an original post, reply, quote, or repost when visible.

Do not return link-only recent posts unless the source provides no text. If the post text is only emoji, punctuation, or a short word, return that exact text and say that no longer text is visible. If it is a quote or reply, include the visible quoted/replied-to post text and link when available.`;
}

export function buildThreadPrompt(params) {
  return `Use x_thread_fetch to get the full thread from this X post: ${JSON.stringify(params.post_url)}
Include all visible posts in chronological order. For each post include exact visible text, author handle, date/time, and link. If a post has no visible text, say "no visible text" instead of returning only a link.`;
}
