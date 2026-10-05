export default function PollsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="flex-1 min-h-[calc(100vh-200px)]">
        {children}
      </main>
    </>
  );
}
