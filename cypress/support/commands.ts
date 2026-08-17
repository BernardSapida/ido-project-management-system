/// <reference types="cypress" />

/**
 * How long to allow for the client tree to mount.
 *
 * This is a DEV-SERVER cost, not a product one. Vite serves modules unbundled,
 * and these pages pull in HeroUI, React Aria, framer-motion, calendars, RHF and
 * zod - over a thousand separate module requests on a cold browser, which
 * Cypress always has. On top of that the app currently hydrates with a MISMATCH,
 * so React discards the server HTML and re-renders the whole tree rather than
 * just attaching handlers. Measured at 15-20s for the form reference page; 45s
 * is headroom, not an expectation.
 */
const INTERACTIVE_TIMEOUT_MS = 60_000;
const POLL_MS = 100;

/** Bounded scan: React renders top-down, so if anything is mounted the first
 *  screenful of nodes carries fiber keys. Scanning all ~1000 nodes every 100ms
 *  would cost more than it measures. */
const NODES_TO_SCAN = 200;

function isReactMounted(doc: Document): boolean {
	const nodes = doc.querySelectorAll("body *");
	const limit = Math.min(nodes.length, NODES_TO_SCAN);
	for (let i = 0; i < limit; i += 1) {
		for (const key of Object.getOwnPropertyNames(nodes[i])) {
			if (key.startsWith("__react")) return true;
		}
	}
	return false;
}

/**
 * Block until React has actually attached to the DOM.
 *
 * ## Why this is not `cy.wait(20000)`
 *
 * A fixed wait is wrong in both directions: it is dead time on a warm load -
 * every visit after the first, once the browser has the modules cached - and it
 * is still too short on a cold one. This returns the moment the page is genuinely
 * interactive, so a spec pays the full cost once and pennies afterwards.
 *
 * ## Why it checks React internals
 *
 * Because the page is server-rendered, nothing observable in the DOM
 * distinguishes "rendered" from "interactive". Every control is present and
 * clickable long before React is listening, and clicks that land early are
 * silently dropped - which is why AppSelect, AppComboBox and AppAutocomplete
 * appear to ignore the first clicks of a run. Typing, ticking a checkbox and
 * flipping a switch are all handled natively by the browser, so they pass
 * against markup that will discard the interaction the moment it hydrates.
 *
 * A React fiber key on a host node is the one signal that cannot be faked: it
 * exists only where React has rendered. The TanStack devtools badge in the
 * corner is the same event made visible - it is rendered inside the client tree,
 * which is why "the badge appeared" and "the page started working" are one
 * moment, not two.
 */
Cypress.Commands.add("waitUntilInteractive", () => {
	Cypress.log({ displayName: "hydrate", message: "waiting for React to attach" });

	// The timeout has to be on `.then()` as well. Cypress applies
	// `defaultCommandTimeout` (5s here) to the promise a `.then()` returns, so
	// without this the command dies at 5s no matter what the loop below allows.
	cy.window({ log: false, timeout: INTERACTIVE_TIMEOUT_MS }).then(
		{ timeout: INTERACTIVE_TIMEOUT_MS },
		(win) =>
			new Cypress.Promise<void>((resolve, reject) => {
				const started = Date.now();
				const poll = () => {
					if (isReactMounted(win.document)) {
						resolve();
						return;
					}
					if (Date.now() - started > INTERACTIVE_TIMEOUT_MS) {
						reject(
							new Error(
								`React never attached within ${INTERACTIVE_TIMEOUT_MS}ms. ` +
									"The page is server-rendered, so it LOOKS fine while every click is dropped. " +
									"Check the dev server is up, then check the browser console for a hydration error.",
							),
						);
						return;
					}
					setTimeout(poll, POLL_MS);
				};
				poll();
			}),
	);
});

declare global {
	namespace Cypress {
		interface Chainable {
			/** Block until React has attached to the DOM - see the comment above. */
			waitUntilInteractive(): Chainable<void>;
		}
	}
}

export {};
