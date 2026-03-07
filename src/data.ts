const BASE = import.meta.env.BASE_URL + 'data/';

export async function load<T>(file: string): Promise<T> {
  const res = await fetch(BASE + file);
  return res.json() as Promise<T>;
}
