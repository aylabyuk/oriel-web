const API_URL =
  'https://v2.jokeapi.dev/joke/Pun,Misc,Programming?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&amount=10';

type JokeResponse =
  | { type: 'single'; joke: string }
  | { type: 'twopart'; setup: string; delivery: string };

type ApiBatch = { error: boolean; jokes: JokeResponse[] };

/** Flatten a joke response into a single string. */
const flatten = (j: JokeResponse): string =>
  j.type === 'single' ? j.joke : `${j.setup} ... ${j.delivery}`;

/**
 * Fetch a batch of safe jokes from JokeAPI.
 * Returns an array of joke strings, or an empty array on failure.
 */
export const fetchJokes = async (): Promise<string[]> => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) return [];
    const data = (await res.json()) as ApiBatch;
    if (data.error || !data.jokes) return [];
    return data.jokes.map(flatten);
  } catch {
    return [];
  }
};
