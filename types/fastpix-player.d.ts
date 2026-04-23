declare module "@fastpix/fp-player" {
  const content: unknown;
  export default content;
}

declare namespace React.JSX {
  interface IntrinsicElements {
    "fastpix-player": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        "playback-id"?: string;
        "stream-type"?: string;
        token?: string;
        "custom-domain"?: string;
      },
      HTMLElement
    >;
  }
}
