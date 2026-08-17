/**
 * E2E reference tests for all HeroUI v3 input types.
 *
 * All selectors use [data-cy] attributes set on the root element of each
 * form component. Sub-element selectors within a data-cy scope:
 *   Text / InputGroup  [data-cy="x"] input  (InputGroup needs { force: true } on type)
 *   TextArea           [data-cy="x"] textarea
 *   NumberField        [data-cy="x"] input
 *   Select             [data-cy="x"] [data-slot="select-trigger"]
 *   ComboBox           [data-cy="x"] input  (needs { force: true } on type)
 *   Autocomplete       [data-cy="x"] [data-slot="autocomplete-trigger"]  (renders as <div>)
 *   Date/Time fields   [data-cy="x"] [role="spinbutton"]
 *   RadioGroup         [data-cy="x"].contains("Label text") — same pattern as CheckboxGroup, [role="radio"] has no text content
 *   CheckboxGroup      [data-cy="x"].contains("Label text") — .contains('[role="checkbox"]', text) fails because the control element has no text content
 *   Switch             [data-cy="x"] [role="switch"]  — is a native <input>, use .be.checked / .not.be.checked (not aria-checked)
 *   Checkbox           [data-cy="x"] input[type="checkbox"]  — native input has no explicit role attribute
 */

describe("Form Reference — HeroUI v3 Input Types", () => {
	beforeEach(() => {
		cy.visit("/form-reference");

		// Blocks until React has actually attached. Replaces a fixed `cy.wait(800)`,
		// which was both dead time on a warm load and far too short on a cold one -
		// clicks that land before hydration are silently dropped, so the spec fails
		// later on what looks like a bad selector.
		cy.waitUntilInteractive();
	});

	// ── AppTextField ─────────────────────────────────────────────────────────────

	it("AppTextField — types and changes a text value", () => {
		cy.get('[data-cy="firstName"] input').scrollIntoView().type("Jane");
		cy.get('[data-cy="firstName"] input').should("have.value", "Jane");

		// {selectAll} replaces the current value in a single type() call,
		// avoiding the React re-render reset that .clear() triggers
		cy.get('[data-cy="firstName"] input').scrollIntoView().type("{selectAll}Alice");
		cy.get('[data-cy="firstName"] input').should("have.value", "Alice");
	});

	// ── AppInputGroup ─────────────────────────────────────────────────────────────

	it("AppInputGroup — types email and website into icon-prefixed fields", () => {
		cy.get('[data-cy="email"] input').scrollIntoView().type("jane@example.com", { force: true });
		cy.get('[data-cy="email"] input').should("have.value", "jane@example.com");

		cy.get('[data-cy="website"] input').scrollIntoView().type("https://example.com", { force: true });
	});

	// ── AppTextArea ───────────────────────────────────────────────────────────────

	it("AppTextArea — types multi-line text into bio", () => {
		cy.get('[data-cy="bio"] textarea')
			.scrollIntoView()
			.type("This is a biography with more than ten characters.", { force: true });
	});

	// ── AppNumberField ────────────────────────────────────────────────────────────

	it("AppNumberField — changes the default value of 0 to 25", () => {
		cy.get('[data-cy="age"] input').scrollIntoView().click().type("{selectAll}25").blur();
	});

	// ── AppSelect ─────────────────────────────────────────────────────────────────

	it("AppSelect — selects Philippines from the country dropdown", () => {
		cy.get('[data-cy="country"]').find("button").click();
		cy.contains('[role="option"]', "Philippines").click();
	});

	// ── AppComboBox ───────────────────────────────────────────────────────────────

	it("AppComboBox — selects a framework by filtering with keyboard input", () => {
		cy.get('[data-cy="framework"] input').scrollIntoView().type("Vue", { force: true });
		cy.contains('[role="option"]', "Vue").click();
		cy.get('[data-cy="framework"] input').should("have.value", "Vue");
	});

	// ── AppAutocomplete ───────────────────────────────────────────────────────────

	it("AppAutocomplete — selects Manila via the search popover", () => {
		cy.get('[data-cy="city"]').find('[data-slot="autocomplete-trigger"]').scrollIntoView().click();
		cy.get('[placeholder="Search city..."]').type("Man");
		cy.contains('[role="option"]', "Manila").click();
		cy.contains("Manila").should("be.visible");
	});

	// ── AppDateField ──────────────────────────────────────────────────────────────

	it("AppDateField — fills month, day, and year segments for birth date", () => {
		cy.get('[data-cy="birthDate"]')
			.find('[role="spinbutton"]')
			.then(($segs) => {
				cy.wrap($segs[0]).scrollIntoView().click().type("01"); // month
				cy.wrap($segs[1]).scrollIntoView().click().type("15"); // day
				cy.wrap($segs[2]).scrollIntoView().click().type("1990"); // year
			});
	});

	// ── AppDatePicker ─────────────────────────────────────────────────────────────

	it("AppDatePicker — fills appointment date via inline segments", () => {
		cy.get('[data-cy="appointment"]')
			.find('[role="spinbutton"]')
			.then(($segs) => {
				cy.wrap($segs[0]).scrollIntoView().click().type("06"); // month
				cy.wrap($segs[1]).scrollIntoView().click().type("15"); // day
				cy.wrap($segs[2]).scrollIntoView().click().type("2025"); // year
			});
	});

	// ── AppDateRangePicker ────────────────────────────────────────────────────────

	it("AppDateRangePicker — fills start (segments 0–2) and end (segments 3–5) dates", () => {
		cy.get('[data-cy="eventRange"]')
			.find('[role="spinbutton"]')
			.then(($segs) => {
				cy.wrap($segs[0]).scrollIntoView().click().type("01"); // start month
				cy.wrap($segs[1]).scrollIntoView().click().type("01"); // start day
				cy.wrap($segs[2]).scrollIntoView().click().type("2025"); // start year
				cy.wrap($segs[3]).scrollIntoView().click().type("01"); // end month
				cy.wrap($segs[4]).scrollIntoView().click().type("31"); // end day
				cy.wrap($segs[5]).scrollIntoView().click().type("2025"); // end year
			});
	});

	// ── AppTimeField ──────────────────────────────────────────────────────────────

	it("AppTimeField — fills hour, minute, and AM/PM segments for meeting time", () => {
		cy.get('[data-cy="meetingTime"]')
			.find('[role="spinbutton"]')
			.then(($segs) => {
				cy.wrap($segs[0]).scrollIntoView().click().type("09"); // hour
				cy.wrap($segs[1]).scrollIntoView().click().type("30"); // minute
				cy.wrap($segs[2]).scrollIntoView().click().type("a"); // AM — type 'a' for AM, 'p' for PM
			});
	});

	// ── AppRadioGroup ─────────────────────────────────────────────────────────────

	it("AppRadioGroup — selects the Admin radio option", () => {
		cy.get('[data-cy="role"]').contains("Admin").scrollIntoView().click({ force: true });
	});

	// ── AppCheckboxGroup ──────────────────────────────────────────────────────────

	it("AppCheckboxGroup — checks multiple notification channels", () => {
		cy.get('[data-cy="notifications"]').contains("Email").scrollIntoView().click({ force: true });
		cy.get('[data-cy="notifications"]').contains("Push").scrollIntoView().click({ force: true });
	});

	// ── AppSwitch ─────────────────────────────────────────────────────────────────

	it("AppSwitch — toggles newsletter from false (default) to true", () => {
		cy.get('[data-cy="newsletter"]').find('[role="switch"]').scrollIntoView().should("not.be.checked");
		cy.get('[data-cy="newsletter"]').find('[role="switch"]').click({ force: true });
		cy.get('[data-cy="newsletter"]').find('[role="switch"]').should("be.checked");
	});

	// ── AppCheckbox ───────────────────────────────────────────────────────────────

	it("AppCheckbox — checks the agree to terms checkbox", () => {
		cy.get('[data-cy="agreeToTerms"]').find('input[type="checkbox"]').scrollIntoView().click({ force: true });
	});

	// ── Full Form Submission ──────────────────────────────────────────────────────

	it("submits the form after filling every required field", () => {
		// Text & Input
		cy.get('[data-cy="firstName"] input').scrollIntoView().type("Jane");
		cy.get('[data-cy="lastName"] input').scrollIntoView().type("Doe");
		cy.get('[data-cy="email"] input').scrollIntoView().type("jane@example.com", { force: true });
		cy.get('[data-cy="website"] input').scrollIntoView().type("https://jane.dev", { force: true });
		cy.get('[data-cy="bio"] textarea').scrollIntoView().type("Frontend developer based in Manila.", { force: true });

		// Number — default is 0, change to 25
		cy.get('[data-cy="age"] input').scrollIntoView().click().type("{selectAll}25").blur();

		// Selection
		cy.get('[data-cy="country"]').find('[data-slot="select-trigger"]').scrollIntoView().click();
		cy.contains('[role="option"]', "Philippines").click();

		cy.get('[data-cy="framework"] input').scrollIntoView().type("React", { force: true });
		cy.contains('[role="option"]', "React").click();

		cy.get('[data-cy="city"]').find('[data-slot="autocomplete-trigger"]').scrollIntoView().click();
		cy.get('[placeholder="Search city..."]').type("Cebu");
		cy.contains('[role="option"]', "Cebu").click();

		// Dates
		cy.get('[data-cy="birthDate"]')
			.find('[role="spinbutton"]')
			.then(($segs) => {
				cy.wrap($segs[0]).scrollIntoView().click().type("03");
				cy.wrap($segs[1]).scrollIntoView().click().type("20");
				cy.wrap($segs[2]).scrollIntoView().click().type("1995");
			});

		cy.get('[data-cy="appointment"]')
			.find('[role="spinbutton"]')
			.then(($segs) => {
				cy.wrap($segs[0]).scrollIntoView().click().type("12");
				cy.wrap($segs[1]).scrollIntoView().click().type("01");
				cy.wrap($segs[2]).scrollIntoView().click().type("2025");
			});

		cy.get('[data-cy="eventRange"]')
			.find('[role="spinbutton"]')
			.then(($segs) => {
				cy.wrap($segs[0]).scrollIntoView().click().type("11");
				cy.wrap($segs[1]).scrollIntoView().click().type("01");
				cy.wrap($segs[2]).scrollIntoView().click().type("2025");
				cy.wrap($segs[3]).scrollIntoView().click().type("11");
				cy.wrap($segs[4]).scrollIntoView().click().type("30");
				cy.wrap($segs[5]).scrollIntoView().click().type("2025");
			});

		cy.get('[data-cy="meetingTime"]')
			.find('[role="spinbutton"]')
			.then(($segs) => {
				cy.wrap($segs[0]).scrollIntoView().click().type("10");
				cy.wrap($segs[1]).scrollIntoView().click().type("00");
				cy.wrap($segs[2]).scrollIntoView().click().type("a");
			});

		// Toggles & Groups
		cy.get('[data-cy="role"]').contains("Editor").scrollIntoView().click({ force: true });
		cy.get('[data-cy="notifications"]').contains("Email").scrollIntoView().click({ force: true });
		cy.get('[data-cy="notifications"]').contains("SMS").scrollIntoView().click({ force: true });
		cy.get('[data-cy="newsletter"]').find('[role="switch"]').scrollIntoView().click({ force: true });
		cy.get('[data-cy="agreeToTerms"]').find('input[type="checkbox"]').scrollIntoView().click({ force: true });

		// Submit
		cy.contains("button", "Submit").scrollIntoView().click();

		// Verify submitted values panel
		cy.contains("Submitted values").should("be.visible");
		cy.get("pre").should("contain.text", '"firstName": "Jane"');
		cy.get("pre").should("contain.text", '"country": "ph"');
		cy.get("pre").should("contain.text", '"agreeToTerms": true');
	});
});
