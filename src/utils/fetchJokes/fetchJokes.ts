const API_URL =
  'https://v2.jokeapi.dev/joke/Pun,Misc,Programming?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&amount=10';

type JokeResponse =
  | { type: 'single'; joke: string }
  | { type: 'twopart'; setup: string; delivery: string };

type ApiBatch = { error: boolean; jokes: JokeResponse[] };

export type Joke = { setup: string; punchline?: string };

const toJoke = (j: JokeResponse): Joke =>
  j.type === 'single'
    ? { setup: j.joke }
    : { setup: j.setup, punchline: j.delivery };

/**
 * Fetch a batch of safe jokes from JokeAPI.
 * Returns an array of Joke objects, or an empty array on failure.
 */
export const fetchJokes = async (): Promise<Joke[]> => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) return [];
    const data = (await res.json()) as ApiBatch;
    if (data.error || !data.jokes) return [];
    return data.jokes.map(toJoke);
  } catch {
    return [];
  }
};
