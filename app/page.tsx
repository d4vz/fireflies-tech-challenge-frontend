import { HomeMeetings } from "@app/home-meetings";

export default function Home() {
  return (
    <main className="home-empty h-full overflow-y-auto px-8 pt-8 pb-12">
      <h2 className="mb-4 text-[0.95rem] font-semibold">Recent meetings</h2>
      <HomeMeetings />
    </main>
  );
}
