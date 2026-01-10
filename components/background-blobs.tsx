export default function BackgroundBlobs() {
  return (
    <>
      <div className="fixed top-1/4 left-1/4 w-72 h-72 bg-[#B8B8E0] rounded-full mix-blend-overlay blur-[120px] opacity-20 pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-[#4A5475] rounded-full mix-blend-overlay blur-[100px] opacity-20 pointer-events-none" />
    </>
  );
}