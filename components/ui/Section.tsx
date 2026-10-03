import { Reveal } from './Reveal';

/**
 * The shared section shell: `id` (the anchor), an eyebrow, a heading and a
 * lede. Every section on the page goes through here so the vertical rhythm and
 * heading hierarchy stay identical throughout.
 */
export function Section({
  id,
  eyebrow,
  heading,
  lede,
  children,
  className = '',
}: {
  id: string;
  eyebrow: string;
  heading: string;
  lede?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`shell py-16 sm:py-24 ${className}`}
    >
      <Reveal className="max-w-3xl">
        <p data-reveal className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
          {eyebrow}
        </p>
        <h2
          id={`${id}-heading`}
          data-reveal
          className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
        >
          {heading}
        </h2>
        {lede ? (
          <p data-reveal className="mt-5 text-lg leading-relaxed text-muted">
            {lede}
          </p>
        ) : null}
      </Reveal>
      {children}
    </section>
  );
}
