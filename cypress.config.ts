import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,

  e2e: {
    defaultCommandTimeout: 5_000, // Increase timeout
    /*
     * 60s, not Cypress's default reduced to 10s.
     *
     * The dev server serves modules unbundled, so the FIRST visit to a route
     * compiles and ships its whole graph - measured at 10-25s for the heavier
     * pages. At 10_000 a spec passed when run on its own (warm graph) and failed
     * in a full run the moment it was the first to touch a cold route, with
     * "Your page did not fire its `load` event" - which reads like a broken page
     * rather than a budget that was too small.
     *
     * This is a dev-server cost only; a built bundle loads in a fraction of it.
     */
    pageLoadTimeout: 60_000,
    baseUrl: "http://localhost:4000",
    // viewportWidth: 375,  // width of the screen
    // viewportHeight: 667,  // height of the screen
    viewportWidth: 1280, // width of the screen
    viewportHeight: 920, // height of the screen
    // Underscore-prefixed so `noUnusedParameters` allows the empty placeholder
    // to stay - this is Cypress's documented extension point for node event
    // listeners (tasks, plugins); drop the prefix when you implement one.
    setupNodeEvents(_on, _config) {},
  },
});
