export function LabMark() {
  return <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-teal-700 text-lg font-black text-white">C</span>;
}
export function Arrow({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={className}>→</span>;
}
