import type { CarouselImage } from "@bernardsapida/web-ui";
import { AppButton, AppCarousel, AppCarouselViewer, AppChip, AppGlassCard, AppPageHeader } from "@bernardsapida/web-ui";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Truck } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { seo } from "@/config/seo.config";

/**
 * Carousel lab. Developer reference under /components, which owns the backdrop
 * and the nav; every page there is noindex.
 *
 * The product gallery at the top is the point of the page. What makes this
 * component worth having is not that it slides - it is that the six pictures
 * in that first deck are three different shapes, and every one of them is shown
 * whole, in the same square, without the frame resizing between them. Compare
 * it against "Fitted, never cropped" below, which shows what the same six look
 * like when the frame crops to fill instead.
 *
 * Four things to check by hand, because none of them survive a screenshot:
 *
 * 1. **The wrap.** Turn on the looping deck and press Next on the last picture.
 *    It slides FORWARD into the first, because the track only ever holds three
 *    pictures and the first one is genuinely sitting in the next slot.
 * 2. **The drag.** Pull the picture halfway and let go - it finishes from where
 *    your finger stopped rather than snapping back to the start first. On the
 *    last picture of the non-looping deck it pulls against a resistance and
 *    settles back.
 * 3. **The slideshow's brakes.** Hover the autoplay deck, tab into it, or open
 *    the viewer over it: the timer stops in all three and starts again when you
 *    leave. Any press of an arrow or a thumbnail stops it for good, and there is
 *    nothing that restarts it.
 * 4. **The keyboard.** Tab reaches the strip ONCE; the arrows move inside it
 *    and the picture follows. Then turn on reduced motion and confirm the
 *    slideshow starts paused and the slides change without travelling.
 */
export const Route = createFileRoute("/(references)/components/carousel")({
	head: () => ({
		meta: [{ title: seo.title("Carousel lab") }, { content: "noindex", name: "robots" }],
	}),
	staticData: { breadcrumb: "Carousel" },
	component: CarouselLabPage,
});

function CarouselLabPage() {
	return (
		<div className="space-y-6">
			<AppPageHeader
				subtitle="A deck of pictures in a square, and the full-size viewer behind it."
				title="Carousel lab"
			/>
			<GallerySection />
			<AspectSection />
			<SizeSection />
			<LoopSection />
			<AutoPlaySection />
			<IndicatorSection />
			<ViewerSection />
			<EdgesSection />
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Deliberately three different shapes, at sizes no page would ever serve
 * matched: two landscape, two portrait, two square. A gallery fed by people
 * uploading from their phones looks exactly like this, and a specimen deck of
 * six identical 1:1 crops would prove nothing about the component that shows it.
 */
const PRODUCT: CarouselImage[] = [
	{
		alt: "The chair from the front, against a pale wall",
		caption: "Front, in oak",
		src: "https://picsum.photos/seed/carousel-front/1600/900",
		thumbnailSrc: "https://picsum.photos/seed/carousel-front/240/135",
	},
	{
		alt: "The chair from the side, showing the depth of the seat",
		caption: "Side profile",
		src: "https://picsum.photos/seed/carousel-side/900/1600",
		thumbnailSrc: "https://picsum.photos/seed/carousel-side/135/240",
	},
	{
		alt: "The joint where the back meets the arm, close up",
		caption: "The joint, close up",
		src: "https://picsum.photos/seed/carousel-joint/1200/1200",
		thumbnailSrc: "https://picsum.photos/seed/carousel-joint/180/180",
	},
	{
		alt: "The weave of the seat fabric at full magnification",
		src: "https://picsum.photos/seed/carousel-weave/1800/1000",
		thumbnailSrc: "https://picsum.photos/seed/carousel-weave/270/150",
	},
	{
		alt: "The chair in a living room, beside a window",
		caption: "In a room",
		src: "https://picsum.photos/seed/carousel-room/1000/1500",
		thumbnailSrc: "https://picsum.photos/seed/carousel-room/150/225",
	},
	{
		alt: "The underside, showing the frame and the fixings",
		caption: "Underneath",
		src: "https://picsum.photos/seed/carousel-under/1400/1400",
		thumbnailSrc: "https://picsum.photos/seed/carousel-under/210/210",
	},
];

const CAMPAIGN: CarouselImage[] = [
	{
		alt: "Summer campaign, first frame",
		src: "https://picsum.photos/seed/campaign-1/1600/1000",
	},
	{
		alt: "Summer campaign, second frame",
		src: "https://picsum.photos/seed/campaign-2/1600/1000",
	},
	{
		alt: "Summer campaign, third frame",
		src: "https://picsum.photos/seed/campaign-3/1600/1000",
	},
];

/* -------------------------------------------------------------------------- */
/* The assembly                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Where a carousel actually lives: half a product page, with the picture on one
 * side and the thing you came to decide on the other. Everything below this
 * section is reference.
 */
function GallerySection() {
	return (
		<LabSection
			description="The default: six pictures of three different shapes, a square that never resizes, and a strip that says how many more there are. Press the picture to open it full size."
			title="Product gallery"
			usedIn={["Product detail", "Asset detail", "Report attachments"]}
		>
			<div className="grid gap-6 md:grid-cols-2">
				<AppCarousel
					data-cy="gallery-carousel"
					images={PRODUCT}
					label="Oak lounge chair"
				/>

				<div className="flex flex-col gap-3 self-start">
					<div className="flex flex-wrap items-center gap-2">
						<AppChip
							icon={Check}
							label="In stock"
							tone="success"
						/>
						<AppChip
							icon={Truck}
							label="Free delivery"
						/>
					</div>
					<h3 className="text-xl font-semibold">Oak lounge chair</h3>
					<p className="text-2xl font-bold">$1,240</p>
					<p className="text-sm leading-relaxed text-muted">
						Six photographs at three aspect ratios, which is what a real listing has once more than one person has
						uploaded to it. None of them is cropped to fit the frame.
					</p>
					<AppButton
						className="self-start"
						onPress={() => undefined}
					>
						Add to basket
					</AppButton>
				</div>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */
/* Reference                                                                  */
/* -------------------------------------------------------------------------- */

/** The one rule the component exists to enforce, and the thing it is not. */
function AspectSection() {
	return (
		<LabSection
			description="The same six pictures, fitted whole on the left and cropped to fill on the right. The right-hand frame is not a variant of this component - it is what the component refuses to do, drawn here once so the difference is arguable rather than asserted."
			title="Fitted, never cropped"
		>
			<div className="grid gap-6 sm:grid-cols-2">
				<figure className="flex flex-col gap-2">
					<AppCarousel
						data-cy="fit-carousel"
						images={PRODUCT}
						indicator="dots"
						isZoomable={false}
						label="Fitted to the square"
					/>
					<figcaption className="text-sm text-muted">
						<span className="font-medium text-foreground">Fitted.</span> The mount above and below a landscape shot is
						the cost, and the whole picture is what it buys.
					</figcaption>
				</figure>

				<figure className="flex flex-col gap-2">
					<div className="aspect-square w-full overflow-hidden rounded-3xl border border-border bg-muted-surface">
						<img
							alt="The same landscape photograph, cropped to a square - the left and right of it are gone"
							className="h-full w-full object-cover"
							src={PRODUCT[0]?.src}
						/>
					</div>
					<figcaption className="text-sm text-muted">
						<span className="font-medium text-foreground">Cropped.</span> Nothing looks wrong here, which is the
						problem: a third of the chair is missing and the picture does not say so.
					</figcaption>
				</figure>
			</div>
		</LabSection>
	);
}

/**
 * How to stop a square deck being as tall as a wide column, shown full-bleed -
 * the two-up grid the sections around it use would hide the problem.
 */
function SizeSection() {
	return (
		<LabSection
			description="The frame is square, so its height IS its column's width - fine in a sidebar, 768px tall in an article, and taller still full-bleed. Cap the WIDTH and the whole component narrows: the square holds, the picture still fills it, and the strip stays exactly as wide as the deck it indexes. There is no maxHeight prop, and the section below says why."
			title="Sizing it in a wide column"
			usedIn={["Blog post gallery", "Event recap", "Case study"]}
		>
			<div className="flex flex-col gap-2">
				<p className="text-sm font-medium">className="mx-auto max-w-md"</p>
				<AppCarousel
					className="mx-auto max-w-md"
					data-cy="capped-carousel"
					images={PRODUCT}
					label="Oak lounge chair, in a capped column"
				/>
				<p className="text-sm text-muted">
					`className` lands on the root, above both the stage and the strip, so one cap sizes the pair of them. Below
					the cap the deck is fluid again, which is what keeps this a single class rather than a set of breakpoints.
				</p>
				<p className="text-sm text-muted">
					<span className="font-medium text-foreground">Why not cap the height instead?</span> Clamping height while the
					width runs on turns the frame into a 3:1 slot, and a 16:9 photograph fitted whole inside that leaves a third
					of the mount empty down each side. The dead space reads as a broken image, not as a shorter gallery - so the
					width is the handle, and the square is what it preserves.
				</p>
			</div>
		</LabSection>
	);
}

function LoopSection() {
	return (
		<LabSection
			description="Looping decides two things at once: whether the arrows ever disable, and what a drag past the last picture does. Take both decks to the last picture and compare."
			title="Looping, and the end of a deck"
		>
			<div className="grid gap-6 sm:grid-cols-2">
				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium">isLooping={"{false}"} — the default</p>
					<AppCarousel
						data-cy="finite-carousel"
						images={CAMPAIGN}
						indicator="dots"
						isZoomable={false}
						label="Campaign, finite"
					/>
					<p className="text-sm text-muted">
						The arrow at each end is disabled rather than hidden, so nothing moves under the cursor, and a drag past the
						end pulls against a resistance and settles back.
					</p>
				</div>

				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium">isLooping</p>
					<AppCarousel
						data-cy="looping-carousel"
						images={CAMPAIGN}
						indicator="dots"
						isLooping
						isZoomable={false}
						label="Campaign, looping"
					/>
					<p className="text-sm text-muted">
						The wrap slides forward into the first picture rather than rewinding through the deck, because the track
						only ever holds three.
					</p>
				</div>
			</div>
		</LabSection>
	);
}

function AutoPlaySection() {
	return (
		<LabSection
			description="Three seconds a picture, and five separate things that stop it: the pointer over it, focus inside it, the tab going to the background, the viewer opening over it, and any press of an arrow or a thumbnail. The first four are a reprieve; the fifth is the end of it."
			title="Autoplay"
		>
			<div className="mx-auto max-w-sm">
				<AppCarousel
					autoPlayMs={3000}
					data-cy="autoplay-carousel"
					images={CAMPAIGN}
					indicator="dots"
					isAutoPlaying
					isLooping
					label="Summer campaign"
				/>
			</div>
			<p className="text-sm text-muted">
				Stopping on a manual move is deliberate and permanent, and there is no Play control to undo it. Something that
				resumes four seconds after a person reached for the arrows is a carousel arguing with its reader, and that
				interaction is also the only way to stop it - so it cannot be a reprieve. Reduced motion never starts it.
			</p>
		</LabSection>
	);
}

function IndicatorSection() {
	return (
		<LabSection
			description="Thumbnails are the default: a picture is its own label, and the strip doubles as the jump target. Dots are for a banner where a second row of pictures under the first would be a gallery of a gallery. None is for a deck the page indexes some other way."
			title="Indicators"
		>
			<div className="grid gap-6 sm:grid-cols-3">
				{(["thumbnails", "dots", "none"] as const).map((indicator) => (
					<div
						className="flex flex-col gap-2"
						key={indicator}
					>
						<p className="text-sm font-medium">indicator="{indicator}"</p>
						<AppCarousel
							data-cy={`indicator-${indicator}`}
							images={CAMPAIGN}
							indicator={indicator}
							isZoomable={false}
							label={`Campaign, ${indicator}`}
						/>
					</div>
				))}
			</div>
		</LabSection>
	);
}

/**
 * The viewer on its own, because it is exported and a caller may already have a
 * picture on screen that wants opening full size without an inline deck under
 * it.
 */
function ViewerSection() {
	const [index, setIndex] = useState(0);
	const [isOpen, setIsOpen] = useState(false);

	return (
		<LabSection
			description="The same deck as a modal: the arrows move off the photograph, the thumbnails stay, and on a phone the arrows drop under the picture into the thumb zone. Escape closes it and focus returns to whatever opened it."
			title="The viewer, opened directly"
		>
			<div className="flex flex-wrap items-center gap-3">
				<AppButton
					data-cy="open-viewer"
					onPress={() => setIsOpen(true)}
				>
					Open at picture {index + 1}
				</AppButton>
				<p className="text-sm text-muted">
					It is controlled, so where you get to in here is where the caller is when it closes.
				</p>
			</div>

			<AppCarouselViewer
				data-cy="standalone-viewer"
				images={PRODUCT}
				index={index}
				isLooping
				isOpen={isOpen}
				label="Oak lounge chair"
				onClose={() => setIsOpen(false)}
				onIndexChange={setIndex}
			/>
		</LabSection>
	);
}

function EdgesSection() {
	return (
		<LabSection
			description="The two decks that are not a deck. Neither renders an arrow, a strip or a counter - controls for moving through one picture are furniture that never does anything."
			title="Edges"
		>
			<div className="grid gap-6 sm:grid-cols-2">
				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium">One picture</p>
					<AppCarousel
						data-cy="single-carousel"
						images={[PRODUCT[0] as CarouselImage]}
						label="Oak lounge chair, one photograph"
					/>
					<p className="text-sm text-muted">Still opens full size on a press - that is the one control it keeps.</p>
				</div>

				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium">No pictures</p>
					<AppCarousel
						data-cy="empty-carousel"
						images={[]}
						label="Nothing uploaded yet"
					/>
					<p className="text-sm text-muted">
						Holds the square rather than collapsing, so a gallery still loading and a gallery that came back empty do
						not look like the same page.
					</p>
				</div>
			</div>
		</LabSection>
	);
}

/* -------------------------------------------------------------------------- */

function LabSection({
	children,
	description,
	title,
	usedIn,
}: {
	children: ReactNode;
	description: string;
	title: string;
	usedIn?: string[];
}) {
	return (
		<AppGlassCard>
			<AppGlassCard.Content className="flex flex-col gap-4 p-5">
				<div className="flex flex-col gap-1">
					<h2 className="text-lg font-semibold">{title}</h2>
					<p className="text-sm leading-relaxed text-muted">{description}</p>
					{usedIn ? (
						<ul className="mt-2 flex flex-wrap gap-1.5">
							{usedIn.map((screen) => (
								<li
									className="rounded-full bg-muted-surface px-2.5 py-0.5 text-xs text-muted"
									key={screen}
								>
									{screen}
								</li>
							))}
						</ul>
					) : null}
				</div>
				{children}
			</AppGlassCard.Content>
		</AppGlassCard>
	);
}
