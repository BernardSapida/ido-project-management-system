/**
 * `@bernardsapida/web-ui/rich-text` - AppRichTextEditor, plus AppBlogPost which renders its documents.
 *
 * Its own entry so the twelve `@tiptap/*` packages stay OPTIONAL peer
 * dependencies: a child that never imports this never installs them.
 */
export * from "./components/AppBlogPost";
export * from "./components/AppRichTextEditor";
