export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex-1 min-h-[calc(100vh-200px)]">{children}</div>
    </>
  );
}
