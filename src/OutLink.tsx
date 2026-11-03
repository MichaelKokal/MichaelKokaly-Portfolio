import type { AnchorHTMLAttributes } from "react";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string };

/**
 * A link that opens in a new tab without an href, so the browser doesn't show the
 * address in the bottom corner on hover. Click, middle click and Enter all open it.
 */
export function OutLink({ to, tabIndex = 0, onClick, ...rest }: Props) {
  const open = () => window.open(to, "_blank", "noreferrer");
  return (
    <a
      {...rest}
      role="link"
      tabIndex={tabIndex}
      data-to={to}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) open();
      }}
      onAuxClick={(e) => e.button === 1 && open()}
      onKeyDown={(e) => e.key === "Enter" && open()}
    />
  );
}
