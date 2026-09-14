export {};

declare global {
  interface Window {
    /** Set at container start from `API_URL` via `/env.js`. */
    __GGE_API_URL__?: string;
  }
}
