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

export function buildUserPostsPrompt(params) {
  let query = `from:${String(params.username).replace(/^@/, "")}`;

  if (params.from_date) {
    query += ` since:${params.from_date}`;
  }

  if (params.to_date) {
    query += ` until:${params.to_date}`;
  }

  let prompt = `Use x_keyword_search to search X/Twitter for posts from user ${JSON.stringify(
    params.username
  )} with query: ${JSON.stringify(query)}`;

  if (params.max_results) {
    prompt += `\nReturn at most ${params.max_results} posts.`;
  }

  prompt +=
    "\nReturn newest posts first. For each post include exact visible post text, author handle, date/time, post link, and quoted/replied-to context when visible. If a post has no visible text, say \"no visible text\" instead of returning only a link.";
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
  const mode = params.mode ?? "balanced";
  const maxPosts = params.max_posts ?? 50;

  return `Use x_thread_fetch to get the full thread from this X post: ${JSON.stringify(params.post_url)}
Mode: ${mode}
Maximum visible posts to return: ${maxPosts}

Return the best visible thread context within that limit, not an exhaustive dump if the thread is very large.
- summary mode: include the root/parent post, target post, and the most important visible replies or quotes.
- balanced mode: include root/parent post, target post, and a representative chronological set of visible replies/quotes.
- deep mode: include as many visible posts as practical up to the maximum.

For each post include exact visible text, author handle, date/time, and link. If a post has no visible text, say "no visible text" instead of returning only a link.`;
}
