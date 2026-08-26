export default function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="max-w-2xl"><p className="eyebrow mb-3">{eyebrow}</p><h1 className="page-title">{title}</h1><p className="mt-4 text-base leading-7 text-slate-600">{description}</p></div>{action}</div>;
}
