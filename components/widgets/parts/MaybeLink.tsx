import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type MaybeLinkProps = {
  /* Sem endereço (ex.: livro de outra pessoa), vira um bloco comum. */
  href?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/* Link quando há para onde ir; senão, um <div> com a mesma aparência. */
export default function MaybeLink({ href, className, style, children }: MaybeLinkProps) {
  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
